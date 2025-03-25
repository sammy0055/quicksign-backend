const StripeSubscriptionService = require("../services/stripeSubscription.service.js");
const StripeService = require("../services/stripe.service.js");
require("dotenv").config();

class SubscriptionController {
  constructor(SubscriptionService) {
    this.SubscriptionService = SubscriptionService;
  }

  async getUserSubscriptionPlan(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).send({
          code: 400,
          message: "User id is required",
        });
      }

      // Retrieve the subscription record for the user (assuming the service still uses companySubscription logic)
      const userSubscription = await this.SubscriptionService.findOne({
        where: {
          userId: userId,
          isDeleted: false,
        },
      });

      if (!userSubscription.stripePlanId) {
        return res.status(404).send({
          code: 404,
          // message: "User subscription not found",
        });
      }

      // Retrieve the plan details using the Stripe plan id stored in the subscription record
      const plan = await StripeService.getPlanDetail(
        userSubscription.stripePlanId
      );

      return res.status(200).send({
        code: 200,
        data: plan,
        message: "User Subscription Plan Retrieved Successfully",
      });
    } catch (error) {
      console.error("Error in getUserSubscriptionPlan:", error);
      return res.status(500).send({
        code: 500,
        message: "Error retrieving user subscription plan",
        error: error.message,
      });
    }
  }

  async checkSubscription(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).send({
          code: 400,
          message: "User id is required",
        });
      }

      const whereClause = {
        where: {
          userId: userId,
          isDeleted: false,
        },
      };

      // Retrieve the subscription data
      const subscriptionData = await StripeSubscriptionService.findOne(
        whereClause
      );
      if (!subscriptionData) {
        return res.status(404).send({
          code: 404,
          message: "Subscription data not found",
        });
      }

      // Check the subscription status via Stripe
      const checkStripeSub = await StripeService.checkSubscriptionStatus(
        subscriptionData
      );
      const today = new Date();
      let subscriptionStatus = false;

      if (!checkStripeSub || new Date(checkStripeSub.expiryDate) <= today) {
        subscriptionStatus = false;
      } else {
        subscriptionStatus = true;
      }

      return res.status(200).send({
        code: 200,
        data: {
          subscription: subscriptionStatus,
          status: subscriptionStatus ? "Valid" : "Expired",
        },
        message: "User Subscription Status Retrieved Successfully",
      });
    } catch (error) {
      console.error("Error in checkSubscription:", error);
      return res.status(500).send({
        code: 500,
        message: "Error checking subscription status",
        error: error.message,
      });
    }
  }
}

module.exports = SubscriptionController;
