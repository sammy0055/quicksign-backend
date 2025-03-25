class BillingController {
  constructor(billingService) {
    this.billingService = billingService;
  }

  async createBilling(req, res) {
    try {
      const { billingEmail, cardNumber, cardType, expiryDate, status } =
        req.body;
      const userId = req.userId; // Assumes userId is attached to the request by authentication middleware

      // Call service to create a billing record
      const newBilling = await this.billingService.createBilling({
        billingEmail,
        cardNumber,
        cardType,
        expiryDate,
        status,
        userId,
      });

      return res.status(201).json({
        success: true,
        data: newBilling,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error creating billing record",
        error: error.message,
      });
    }
  }

  /**
   * Get the billing record for the authenticated user.
   */
  async getBillingByUser(req, res) {
    try {
      const userId = req.userId; // Assumes userId is set in the request

      const billing = await this.billingService.getBillingByUser(userId);
      if (!billing) {
        return res.status(404).json({
          success: false,
          // message: "Billing details not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: billing,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error fetching billing details",
        error: error.message,
      });
    }
  }

  /**
   * Update an existing billing record by its ID.
   */
  async updateBilling(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedBilling = await this.billingService.updateBilling(
        id,
        updates
      );
      if (!updatedBilling) {
        return res.status(404).json({
          success: false,
          message: "Billing record not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedBilling,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error updating billing record",
        error: error.message,
      });
    }
  }

  /**
   * Delete a billing record by its ID.
   */
  async deleteBilling(req, res) {
    try {
      const { id } = req.params;

      const deleted = await this.billingService.deleteBilling(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Billing record not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Billing record deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error deleting billing record",
        error: error.message,
      });
    }
  }
}
module.exports = BillingController;
