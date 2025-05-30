const StripeSubscriptionService = require("./stripeSubscription.service");
const SubscriptionService = require("../services/subscription.service");
const { StripeProductService } = require("./stripeProduct.service");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const WEB_BASE_URL = `${process.env.ANGULARURL}/dashboard` || "";

class StripeService {
  static async createCustomer(user) {
    return await stripe.customers.create({
      email: user.email,
      name: `${user.displayName}`,
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

  static async subscribe(stripeId, plan, userId) {
    // Step 1: Fetch payment methods
    const customerId = stripeId;
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    // Step 1: Check for an existing subscription for the user
    const existingSubscription = await StripeSubscriptionService.findOne({
      where: { userId: userId },
    });

    let stripeSubscription;
    const isPaymentMethodLinked = paymentMethods.data.length > 0;

    //payment method linked ----------------------------------------------
    if (isPaymentMethodLinked) {
      if (existingSubscription) {
        // isPaymentMethodLinked:true, existingSubscription:true
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
      }
      if (!existingSubscription) {
        // isPaymentMethodLinked:true, existingSubscription:false
        // Step 3: Create a new subscription if none exists (no trial)
        const firstPaymentMethod = paymentMethods.data[0];
        stripeSubscription = await stripe.subscriptions.create({
          customer: stripeId, //stripeId is customer id
          default_payment_method: firstPaymentMethod.id,
          items: [
            {
              price: plan.default_price,
            },
          ],
        });
      }

      return {
        stripeSubscription,
        message: "Subscription created successfully",
      };
    }

    // no payment method linked ---------------------------------------------
    if (!isPaymentMethodLinked) {
      // Now create a new Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            price: plan.default_price, // Replace with actual Stripe Price ID
            quantity: 1,
          },
        ],
        payment_method_types: ["card"],
        success_url: `${WEB_BASE_URL}`,
        cancel_url: `${WEB_BASE_URL}`,
      });

      return {
        needsCheckout: true,
        redirectUrl: session.url,
        message: "Redirect user to this URL to add card and subscribe",
      };
    }

    throw new Error("Subscription creation not implemented yet");
  }

  static async getSubscriptions(stripeId) {
    return await stripe.customers.subscriptions.list({
      customer: stripeId,
      limit: 1,
    });
  }
}

module.exports = StripeService;
