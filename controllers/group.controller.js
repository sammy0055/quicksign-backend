const groupService = require("../services/group.service");

module.exports = {
  // Create a new group
  async createGroup(req, res) {
    try {
      const { name, signatureRoutine, clientIds } = req.body;

      // Call service to create the group and associate clients
      const newGroup = await groupService.createGroup({
        name,
        signatureRoutine,
        clientIds,
        userId: req.userId,
      });

      return res.status(201).json({
        success: true,
        data: newGroup,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error creating group",
        error: error.message,
      });
    }
  },

  //create group by  uploading csv file
  async uploadCsvForGroup(req, res) {
    try {
      const { name } = req.body; // Extract 'name' from the request body
      const userId = req.userId; // Extract 'userId' from the middleware

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      if (!name || !userId) {
        return res.status(400).json({
          success: false,
          message: "Group name and user ID are required",
        });
      }

      const filePath = req.file.path; // Get the path of the uploaded file

      // Call the service to create the group and process the CSV
      const result = await groupService.createGroupFromCsv(
        name,
        filePath,
        userId
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          group: result.group,
          numberOfClientsAdded: result.numberOfClientsAdded,
          numberOfClientsNotAdded: result.numberOfClientsNotAdded,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  // Get all groups (with optional filters)
  async getAllGroups(req, res) {
    try {
      const { offset = 0, limit = 10, filters } = req.body;
      const userId = req.userId;
      const groups = await groupService.getAllGroups({
        offset: parseInt(offset, 10),
        limit: parseInt(limit, 10),
        filters,
        userId,
      });

      return res.status(200).json({
        success: true,
        data: groups.data,
        total: groups.total,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error fetching groups",
        error: error.message,
      });
    }
  },

  // Get a group by ID
  async getGroupById(req, res) {
    try {
      const { id } = req.params;
      const group = await groupService.getGroupById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: group,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error fetching group",
        error: error.message,
      });
    }
  },

  // Update a group
  async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedGroup = await groupService.updateGroup(id, updates);
      if (!updatedGroup) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: updatedGroup,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error updating group",
        error: error.message,
      });
    }
  },

  // Delete a group
  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      const deleted = await groupService.deleteGroup(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Group deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error deleting group",
        error: error.message,
      });
    }
  },
};
