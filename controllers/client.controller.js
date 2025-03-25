class ClientController {
  constructor(clientService) {
    this.clientService = clientService;
  }

  async getAllClients(req, res) {
    try {
      const { offset = 0, limit = 10, filters, excludeIds = [] } = req.body;
      const userId = req.userId;
      // Parse offset and limit to integers
      const result = await this.clientService.getAllClients({
        offset: parseInt(offset, 10),
        limit: parseInt(limit, 10),
        filters,
        excludeIds,
        userId,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getClientById(req, res) {
    try {
      const result = await this.clientService.getClientById(req.body.id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async createClient(req, res) {
    try {
      const clientData = {
        ...req.body,
        userId: req.userId,
      };

      // Call the service method that will handle create-or-update logic
      const result = await this.clientService.createOrUpdateClient(clientData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      // If the client already existed and was updated, you might want to return a 200 status code.
      const statusCode = result.message.toLowerCase().includes("updated")
        ? 200
        : 201;
      return res.status(statusCode).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async createMultipleClients(req, res) {
    try {
      const result = await this.clientService.createMultipleClients(req.body);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(201).json({
        success: true,
        message: "Multiple clients created successfully.",
        data: result.data,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateClient(req, res) {
    try {
      const result = await this.clientService.updateClient(
        req.params.id,
        req.body
      );
      if (!result.success) {
        return res.status(404).json(result);
      }
      return res.status(200).json({
        success: true,
        message: "Client updated successfully.",
        data: result.data,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteClient(req, res) {
    try {
      const result = await this.clientService.deleteClient(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      return res.status(200).json({
        success: true,
        message: "Client deleted successfully.",
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async searchClients(req, res) {
    try {
      const result = await this.clientService.searchClients(req.query.search);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ClientController;
