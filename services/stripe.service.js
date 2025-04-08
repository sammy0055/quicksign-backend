const StripeSubscriptionService = require("./stripeSubscription.service");
const SubscriptionService = require("../services/subscription.service");
const { StripeProductService } = require("./stripeProduct.service");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const WEB_BASE_URL = process.env.ANGULARURL || "";

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

  static async createMonthlyPlan(data) {
    try {
      const { name, price = 0, currency = "usd", features = [] } = data;
      // Step 1: Create the Product
      const product = await stripe.products.create({
        name: name,
        metadata: { features: JSON.stringify(features) }, // Store features as JSON string
      });

      // Step 2: Create the Monthly Price (Recurring Plan)
      const _price = await stripe.prices.create({
        unit_amount: price * 100, // Convert to cents
        currency: currency,
        recurring: { interval: "month" },
        product: product.id,
      });

      await stripe.products.update(product.id, {
        default_price: _price.id,
      });

      const planToSaveToDB = {
        ...data,
        id: product.id,
        default_price: _price.id,
        price: price,
        interval: _price.recurring.interval,
        images: product.images || [],
      };

      return await StripeProductService.createProduct(planToSaveToDB);
    } catch (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
  }

  static async editPlan(data) {
    const { productId, name, price = 0, currency = "usd", features } = data;
    try {
      // Step 1: Update product details
      const updatedProduct = await stripe.products.update(productId, {
        name: name,
        metadata: { features: JSON.stringify(features) },
      });

      const priceId = updatedProduct.default_price;

      // Step 2: check if price exist
      const prices = await stripe.prices.list({
        product: productId,
      });

      // check if price exist in the product
      const priceToEdit = prices.data?.find(({ id }) => id === priceId);
      if (!priceToEdit) {
        throw new Error("priceId does not exist");
      }

      const priceData = await stripe.prices.retrieve(priceId);
      const isAmountChanged =
        parseInt(priceData.unit_amount_decimal) !== price * 100;

      if (isAmountChanged) {
        // Create a new price
        const _price = await stripe.prices.create({
          unit_amount: price * 100, // Convert to cents
          currency: currency,
          recurring: { interval: "month" },
          product: productId,
        });

        // Update product to use new default price
        await stripe.products.update(productId, {
          default_price: _price.id,
        });
        const updatedData = {
          ...data,
          price: price,
          default_price: _price.id,
        };
        await StripeProductService.updateProduct(updatedData);
        return await StripeProductService.findProduct(productId);
      }

      await StripeProductService.updateProduct(data);
      return await StripeProductService.findProduct(productId);
    } catch (error) {
      console.error("Error editing plan:", error);
      throw error;
    }
  }

  static async archivePlan(productId) {
    try {
      const trialPriceId = process.env.STRIPE_TRIAL_PRICE_ID;
      const product = await stripe.products.retrieve(productId);
      if (product.default_price === trialPriceId)
        throw new Error("Cannot archive trial period plan");

      await stripe.products.update(productId, {
        active: false,
      });

      return await StripeProductService.removeProduct(productId);
    } catch (error) {
      console.error("Error archiving product:", error);
      throw error;
    }
  }

  static async getPlans() {
    return await StripeProductService.findProducts();
  }

  static async getPlanDetail(planId) {
    let plan = await stripe.products.retrieve(planId);
    const price = await stripe.prices.retrieve(plan.default_price);
    plan["price"] = price.unit_amount_decimal / 100;
    plan["currency"] = price.currency;
    plan["interval"] = price.recurring.interval;

    if (plan.metadata.features) {
      plan.metadata.features = JSON.parse(plan.metadata.features);
    }
    return plan;
  }

  static async subscribe(stripeId, plan, userId) {
    // Step 1: Fetch payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeId,
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
        stripeSubscription = await stripe.subscriptions.create({
          customer: stripeId, //stripeId is customer id
          items: [
            {
              price: plan.default_price,
            },
          ],
          trial_period_days: 0, // Explicitly disable trial period
        });
      }

      return {
        stripeSubscription,
        message: "Subscription created successfully",
      };
    }

    // no payment method linked ---------------------------------------------
    if (!isPaymentMethodLinked) {
      if (existingSubscription) {
        const customerId = stripeId;
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
      if (!existingSubscription) {
        // isPaymentMethodLinked:false, existingSubscription:false
        // ✅ No card + no subscription → create subscription checkout
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: plan.default_price, quantity: 1 }],
          payment_method_types: ["card"],
          success_url: `${WEB_BASE_URL}`,
          cancel_url: `${WEB_BASE_URL}`,
        });

        return { needsCheckout: true, redirectUrl: session.url };
      }
    }

    throw new Error("Subscription creation not implemented yet");
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
