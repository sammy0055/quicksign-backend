const StripeSubscriptionService = require("./stripeSubscription.service");
const SubscriptionService = require("../services/subscription.service");
const db = require("../models");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class StripeService {
  static async createCustomer(user) {
    return await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    });
  }

  static async addPaymentMethod(token, stripeId) {
    return await stripe.customers.createSource(stripeId, {
      source: token.id,
    });
  }

  static async getCustomer(stripeId) {
    return await stripe.customers.retrieve(stripeId);
  }
  static async getCustomerPaymentMethods(stripeId) {
    return await stripe.paymentMethods.list({
      customer: stripeId,
      type: "card",
    });
  }

  static async getPlans() {
    let plans = await stripe.products.list({
      limit: 6,
    });
    for (let plan of plans.data) {
      const price = await stripe.prices.retrieve(plan.default_price);

      plan["price"] = price.unit_amount_decimal / 100;
      plan["currency"] = price.currency;
      plan["interval"] = price.recurring.interval;
    }
    return plans;
  }

  static async getPlanDetail(planId) {
    var plan = await stripe.products.retrieve(planId);
    const price = await stripe.prices.retrieve(plan.default_price);
    plan["price"] = price.unit_amount_decimal / 100;
    plan["currency"] = price.currency;
    plan["interval"] = price.recurring.interval;
    return plan;
  }

  // static async subscribe(stripeId, plan, userId) {
  //   const stripeSubscription = await stripe.subscriptions.create({
  //     customer: stripeId,
  //     items: [
  //       {
  //         price: plan.default_price,
  //       },
  //     ],
  //   });
  //   const subscriptionData = {
  //     stripeSubscriptionId: stripeSubscription.id,
  //     stripePriceId: plan.default_price,
  //     name: plan.name,
  //     currency: plan.currency,
  //     price: plan.price,
  //     interval: plan.interval,
  //     userId: userId,
  //     status: stripeSubscription.trial_end
  //       ? "Trial"
  //       : stripeSubscription.status,
  //     expiryDate: new Date(stripeSubscription.current_period_end * 1000),
  //     status: stripeSubscription.status,
  //   };

  //   const subscription = await StripeSubscriptionService.create(
  //     subscriptionData
  //   );

  //   // add subscription to table
  //   const subscriptionService = new SubscriptionService(db.Subscription);
  //   await subscriptionService.create({
  //     stripePlanId: stripeSubscription.stripePlanId, // Will be updated when the user subscribes
  //     userId: userId,
  //   });

  //   // Calculate the document limit based on the plan purchased.
  //   // For monthly plans: Bronze = 20, Silver = 45, Gold = 70.
  //   // For yearly plans: Bronze = 200, Silver = 360, Gold = 840.
  //   let documentLimit = 0;
  //   const planNameLower = plan.name.toLowerCase();

  //   if (plan.interval === "month") {
  //     if (planNameLower.includes("bronze")) {
  //       documentLimit = 20;
  //     } else if (planNameLower.includes("silver")) {
  //       documentLimit = 45;
  //     } else if (planNameLower.includes("gold")) {
  //       documentLimit = 70;
  //     }
  //   } else if (plan.interval === "year") {
  //     if (planNameLower.includes("bronze")) {
  //       documentLimit = 200;
  //     } else if (planNameLower.includes("silver")) {
  //       documentLimit = 360;
  //     } else if (planNameLower.includes("gold")) {
  //       documentLimit = 840;
  //     }
  //   }

  //   const userUpdated = await db.User.update(
  //     { documentLimit },
  //     { where: { id: userId } }
  //   );
  //   return subscription;
  // }

  static async subscribe(stripeId, plan, userId) {
    // Step 1: Check for an existing subscription for the user
    const existingSubscription = await StripeSubscriptionService.findOne({
      where: { userId: userId },
    });

    let stripeSubscription;

    if (existingSubscription) {
      // Step 2: Update the existing Stripe subscription
      stripeSubscription = await stripe.subscriptions.retrieve(
        existingSubscription.stripeSubscriptionId
      );

      const updatedSubscription = await stripe.subscriptions.update(
        stripeSubscription.id,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id, // Use the existing item ID
              price: plan.default_price, // Replace with the new plan's price
            },
          ],
          proration_behavior: "create_prorations", // Adjust billing for mid-cycle changes
        }
      );

      stripeSubscription = updatedSubscription;
    } else {
      // Step 3: Create a new subscription if none exists (no trial)
      stripeSubscription = await stripe.subscriptions.create({
        customer: stripeId,
        items: [
          {
            price: plan.default_price,
          },
        ],
        trial_period_days: 0, // Explicitly disable trial period
      });
    }

    // Step 4: Prepare subscription data for the database
    const subscriptionData = {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: plan.default_price,
      name: plan.name,
      currency: plan.currency,
      price: plan.price,
      interval: plan.interval,
      userId: userId,
      status: "Active", // Always set to Active for subscriptions via this method
      expiryDate: new Date(stripeSubscription.current_period_end * 1000),
    };

    // Step 5: Update or create the subscription in the database
    let subscription;
    if (existingSubscription) {
      subscription = await StripeSubscriptionService.update(subscriptionData, {
        where: { stripeSubscriptionId: stripeSubscription.id },
      });
    } else {
      subscription = await StripeSubscriptionService.create(subscriptionData);
    }

    // Step 6: Update the Subscription table (if needed)
    const subscriptionService = new SubscriptionService(db.Subscription);
    const subscriptionRecord = await subscriptionService.findOne({
      where: { userId: userId },
    });

    if (subscriptionRecord) {
      await subscriptionService.update(
        { stripePlanId: plan.default_price },
        { where: { id: subscriptionRecord.id } }
      );
    } else {
      await subscriptionService.create({
        stripePlanId: plan.default_price,
        userId: userId,
      });
    }

    // Step 7: Calculate and update documentLimit based on the plan
    let documentLimit = 0;
    const planNameLower = plan.name.toLowerCase();

    if (plan.interval === "month") {
      if (planNameLower.includes("bronze")) documentLimit = 20;
      else if (planNameLower.includes("silver")) documentLimit = 45;
      else if (planNameLower.includes("gold")) documentLimit = 70;
    } else if (plan.interval === "year") {
      if (planNameLower.includes("bronze")) documentLimit = 200;
      else if (planNameLower.includes("silver")) documentLimit = 360;
      else if (planNameLower.includes("gold")) documentLimit = 840;
    }

    const userUpdated = await db.User.update(
      { documentLimit },
      { where: { id: userId } }
    );

    return subscription;
  }

  static async createTrialSubscription({
    customerId,
    priceId,
    trialPeriodDays,
  }) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays, // trial period in days
      });
      return subscription;
    } catch (error) {
      console.error("Error creating trial subscription:", error);
      throw error;
    }
  }

  static async resumeSubscription(subscription, stripeId) {
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeId,
      items: [
        {
          price: subscription.stripePriceId,
        },
      ],
    });

    const subscriptionData = {
      currency: stripeSubscription.items.data[0].price.currency,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      price: stripeSubscription.items.data[0].price.unit_amount_decimal / 100,
      interval: stripeSubscription.items.data[0].plan.interval,
      expiryDate: new Date(stripeSubscription.current_period_end * 1000),
      status: stripeSubscription.status,
    };

    await StripeSubscriptionService.update(subscriptionData, {
      where: {
        id: subscription.id,
      },
    });

    subscription.currency = subscriptionData.currency;
    subscription.price = subscriptionData.price;
    subscription.interval = subscriptionData.interval;
    subscription.expiryDate = subscriptionData.expiryDate;
    subscription.status = subscriptionData.status;
    return subscription;
  }

  static async getSubscriptions(stripeId) {
    return await stripe.customers.subscriptions.list({
      customer: stripeId,
      limit: 1,
    });
  }

  static async checkSubscriptionStatus(subscription) {
    if (subscription) {
      const today = new Date();
      if (subscription.expiryDate > today) {
        return subscription;
      }
      const subscriptionData = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      if (subscriptionData) {
        const newSubscription = {
          id: subscription.id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripePriceId: subscriptionData.items.data[0].price.id,
          currency: subscriptionData.items.data[0].price.currency,
          price: subscriptionData.items.data[0].price.unit_amount_decimal / 100,
          interval: subscriptionData.items.data[0].plan.interval,
          expiryDate: new Date(subscriptionData.current_period_end * 1000),
          status: subscriptionData.status,
        };

        await StripeSubscriptionService.update(newSubscription, {
          where: {
            id: subscription.id,
          },
        });

        return newSubscription;
      }

      return subscription;
    } else {
      return null;
    }
  }

  static async getAllCharges(data) {
    const charges = await stripe.charges.list(data);
    return charges;
  }

  static async deleteCustomer(customerId) {
    try {
      return await stripe.customers.del(customerId);
    } catch (error) {
      console.error("Error deleting Stripe customer:", error);
      throw error;
    }
  }
}

module.exports = StripeService;
