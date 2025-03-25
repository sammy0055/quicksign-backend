class SubscriptionService {
  constructor(Subscription) {
    this.Subscription = Subscription;
  }

  async create(data) {
    try {
      const subscription = await this.Subscription.create(data);
      return { success: true, data: subscription };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findOne(query) {
    try {
      const subscription = await this.Subscription.findOne(query);
      if (!subscription) {
        return { success: false, error: "Subscription not found" };
      }
      return { success: true, data: subscription };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findAll(query) {
    try {
      const subscriptions = await this.Subscription.findAll(query);
      return { success: true, data: subscriptions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(updateData, query) {
    try {
      const result = await this.Subscription.update(updateData, query);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(query) {
    try {
      await this.Subscription.destroy(query);
      return { success: true, message: "Subscription deleted successfully" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async count(query) {
    try {
      const count = await this.Subscription.count(query);
      return { success: true, data: count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = SubscriptionService;
