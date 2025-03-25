class BillingService {
  constructor(Billing) {
    this.Billing = Billing;
  }

  async createBilling(data) {
    try {
      const billing = await this.Billing.create(data);
      return billing;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Retrieve the billing record for a given user.
   * @param {String} userId - The user's ID.
   */
  async getBillingByUser(userId) {
    try {
      const billing = await this.Billing.findOne({
        where: { userId, isDeleted: false },
      });
      return billing;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Update an existing billing record.
   * @param {String} id - The billing record ID.
   * @param {Object} updates - The billing data updates.
   */
  async updateBilling(id, updates) {
    try {
      const billing = await this.Billing.findByPk(id);
      if (!billing) {
        return null;
      }
      const updatedBilling = await billing.update(updates);
      return updatedBilling;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Delete a billing record by its ID.
   * @param {String} id - The billing record ID.
   */
  async deleteBilling(id) {
    try {
      const billing = await this.Billing.findByPk(id);
      if (!billing) {
        return null;
      }
      await billing.destroy();
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
module.exports = BillingService;
