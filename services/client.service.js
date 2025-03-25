const { Op } = require("sequelize");
const { User } = require("../models");
class ClientService {
  constructor(Client) {
    this.Client = Client;
  }

  async getAllClients({
    offset = 0,
    limit = 10,
    filters = {},
    excludeIds,
    userId,
  }) {
    try {
      // Construct the 'where' clause based on provided filters
      const whereClause = {
        userId: userId,
      };

      if (filters.createdFrom) {
        whereClause.createdAt = { [Op.gte]: new Date(filters.createdFrom) };
      }

      if (filters.createdTo) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [Op.lte]: new Date(filters.createdTo),
        };
      }

      if (filters.name) {
        whereClause.name = { [Op.like]: `%${filters.name}%` }; // Case-insensitive search
      }

      if (filters.companyNumber) {
        whereClause.companyNumber = filters.companyNumber;
      }

      if (filters.clientEmail) {
        whereClause.clientEmail = { [Op.like]: `%${filters.clientEmail}%` };
      }

      if (filters.phoneNumber) {
        whereClause.phoneNumber = { [Op.like]: `%${filters.phoneNumber}%` };
      }

      if (filters.clientStatus) {
        whereClause.clientStatus = filters.clientStatus;
      }

      // Exclude already selected clients
      if (excludeIds && excludeIds.length > 0) {
        whereClause.id = { [Op.notIn]: excludeIds };
      }
      // Fetch data with pagination and filtering
      const { rows: clients, count: total } = await this.Client.findAndCountAll(
        {
          where: whereClause,
          order: [["createdAt", "DESC"]],
          offset: parseInt(offset, 10),
          limit: parseInt(limit, 10),
          include: [
            {
              model: User,
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        }
      );

      return { success: true, data: clients, total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getClientById(id) {
    try {
      const client = await this.Client.findByPk(id);
      if (!client) {
        return { success: false, error: "Client not found" };
      }
      return { success: true, data: client };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createClient(clientData) {
    try {
      const client = await this.Client.create(clientData);
      return { success: true, data: client };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createOrUpdateClient(clientData) {
    try {
      // Check if a client with the given email exists
      let client = await this.Client.findOne({
        where: { email: clientData.email },
      });

      if (client) {
        // Update the existing client
        await client.update(clientData);
        return {
          success: true,
          message: "Client updated successfully.",
          data: client,
        };
      } else {
        // Create a new client
        client = await this.Client.create(clientData);
        return {
          success: true,
          message: "Client created successfully.",
          data: client,
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createMultipleClients(clientsData) {
    try {
      const clients = await this.Client.bulkCreate(clientsData, {
        validate: true,
        individualHooks: true,
      });
      return { success: true, data: clients };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateClient(id, updateData) {
    try {
      const client = await this.Client.findByPk(id);
      if (!client) {
        return { success: false, error: "Client not found" };
      }

      await client.update(updateData);
      return { success: true, data: client };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteClient(id) {
    try {
      const client = await this.Client.findByPk(id);
      if (!client) {
        return { success: false, error: "Client not found" };
      }

      await client.destroy();
      return { success: true, message: "Client deleted successfully" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = ClientService;
