/**
 * constant database (db) variable to access models
 */
const { StripeSubscription } = require("../models/index.js");
/**
 * Class to create a company Billing service object
 */
class StripeSubscriptionService {
  constructor() {}
  static async create(data) {
    return await StripeSubscription.create(data);
  }
  static async findOne(whereClause) {
    const subscription = await StripeSubscription.findOne(whereClause);
    return subscription;
  }
  static async findAll(whereClause) {
    return await StripeSubscription.findAll(whereClause);
  }
  static async update(updateClause, whereClause) {
    return await StripeSubscription.update(updateClause, whereClause);
  }
  static async delete(whereClause) {
    return await StripeSubscription.destroy(whereClause);
  }
  static async count(whereClause) {
    return await StripeSubscription.count(whereClause);
  }
}

module.exports = StripeSubscriptionService;
