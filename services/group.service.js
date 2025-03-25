const { Group, Client, User } = require("../models");
const { Op } = require("sequelize");
const db = require("../models/index.js");
const { parseCsv } = require("../utils/fileUtils");
const fs = require("fs");

module.exports = {
  // Create a new group
  async createGroup(data) {
    // Create the group first
    const group = await Group.create({
      name: data.name,
      signatureRoutine: data.signatureRoutine,
      userId: data.userId,
    });

    if (data.clientIds && data.clientIds.length > 0) {
      const groupClient = await group.addClients(data.clientIds); // Bulk association
    }

    // Fetch the group with its associated clients
    return await Group.findOne({
      where: { id: group.id },
      include: [
        {
          model: Client,
          through: { attributes: [] }, // Exclude junction table attributes
        },
      ],
    });
  },

  // Create a new group from a CSV file
  async createGroupFromCsv(groupName, filePath, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      // Check if a group with the same name already exists for this user
      const existingGroup = await Group.findOne({
        where: { name: groupName, userId }, // Check for group name and userId
        transaction,
      });

      if (existingGroup) {
        throw new Error("You already have a group with this name.");
      }

      // Parse the CSV file and get valid and invalid clients
      const { validClients, invalidClients } = await parseCsv(filePath);

      // Check for duplicates (email and phone) within the CSV file
      const seenEmails = new Set();
      const seenPhones = new Set();
      const clientsToAdd = []; // Clients to add to the group (existing or new)
      const duplicateClients = []; // Clients skipped due to duplicates in CSV
      const existingClients = []; // Clients that already exist in the database

      // Check for duplicates in the database
      for (const client of validClients) {
        if (!client.email || !client.phone) {
          invalidClients.push({ ...client, reason: "Missing required fields" });
          continue;
        }

        // Check for duplicates within the CSV file
        if (seenEmails.has(client.email) || seenPhones.has(client.phone)) {
          duplicateClients.push({
            ...client,
            reason: "Duplicate email or phone in CSV",
          });
          continue;
        }

        // Check if the client already exists in the database
        const existingClient = await Client.findOne({
          where: {
            [db.Sequelize.Op.or]: [
              { email: client.email },
              { phone: client.phone },
            ],
          },
          transaction,
        });

        if (existingClient) {
          // If client exists, add them to the group
          existingClients.push(existingClient);
        } else {
          // If client does not exist, add them to the list of new clients to create
          clientsToAdd.push(client);
        }

        // Mark email and phone as seen to avoid duplicates within the CSV
        seenEmails.add(client.email);
        seenPhones.add(client.phone);
      }

      // If no valid clients are found, throw an error and do not create the group
      if (clientsToAdd.length === 0 && existingClients.length === 0) {
        throw new Error("No valid clients to add. Group was not created.");
      }

      // Create the group
      const group = await Group.create(
        { name: groupName, userId },
        { transaction }
      );

      // Add new clients to the database and associate them with the group
      if (clientsToAdd.length > 0) {
        const clientsWithGroup = clientsToAdd.map((client) => ({
          ...client,
          groupId: group.id,
        }));
        await Client.bulkCreate(clientsWithGroup, { transaction });
      }

      // Associate existing clients with the group
      if (existingClients.length > 0) {
        await group.addClients(existingClients, { transaction });
      }

      // Commit the transaction
      await transaction.commit();

      // Cleanup file
      fs.unlinkSync(filePath);

      // Calculate the number of clients added and not added
      const numberOfClientsAdded = clientsToAdd.length + existingClients.length;
      const numberOfClientsNotAdded =
        invalidClients.length + duplicateClients.length;

      // Generate a descriptive message
      let message;
      if (numberOfClientsNotAdded > 0) {
        message = `${numberOfClientsAdded} clients were added successfully. ${numberOfClientsNotAdded} clients were not added due to missing required fields, duplicate emails/phone numbers, or existing records in the database.`;
      } else {
        message = "All clients were added successfully.";
      }

      return {
        group,
        numberOfClientsAdded,
        numberOfClientsNotAdded,
        message,
      };
    } catch (error) {
      // Rollback the transaction only if it hasn't been committed
      if (transaction.finished !== "commit") {
        await transaction.rollback();
      }

      // Cleanup file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw new Error(error.message); // Throw the error to be handled by the controller
    }
  },

  // Get all groups with filters
  async getAllGroups({ offset = 0, limit = 10, filters = {}, userId }) {
    try {
      const whereClause = {
        userId: userId,
      };

      // Apply filters
      if (filters.groupFrom) {
        whereClause.createdAt = { [Op.gte]: new Date(filters.groupFrom) };
      }

      if (filters.groupTo) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.lte]: new Date(filters.groupTo),
        };
      }

      if (filters.name) {
        whereClause.name = { [Op.like]: `%${filters.name}%` };
      }

      if (filters.status) {
        whereClause.active = filters.status === "active";
      }

      if (filters.signatureRoutine) {
        whereClause.signatureRoutine = filters.signatureRoutine;
      }

      // Fetch total count of groups
      const total = await Group.count({
        where: whereClause,
      });

      // Fetch paginated groups with member counts
      const groups = await Group.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        offset: parseInt(offset, 10),
        limit: parseInt(limit, 10),
        include: [
          {
            model: User, // Include User model
            attributes: ["firstName", "lastName", "role"],
          },
        ],
        attributes: [
          "id",
          "name",
          "signatureRoutine",
          "active",
          "createdAt",
          [
            db.sequelize.literal(
              `(SELECT COUNT(*) FROM \`GroupClients\` WHERE \`GroupClients\`.\`GroupId\` = \`Group\`.\`id\`)`
            ),
            "members",
          ],
        ],
      });

      return { data: groups, total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getClientsFromGroup(groupId) {
    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: Client,
          through: { attributes: [] }, // Exclude the join table attributes
        },
      ],
    });
    return group ? group.Clients : [];
  },

  // Get a group by ID
  async getGroupById(id) {
    return await Group.findByPk(id, {
      include: [{ model: Client }, { model: User }],
    });
  },

  // Update a group
  async updateGroup(id, updates) {
    const group = await Group.findByPk(id);
    if (!group) {
      return null;
    }
    return await group.update(updates);
  },

  // Delete a group
  async deleteGroup(id) {
    const group = await Group.findByPk(id);
    if (!group) {
      return null;
    }
    await group.destroy();
    return true;
  },
};
