const db = require("../models");
const { StripeProductService } = require("../services/stripeProduct.service");
const StripeSubscriptionService = require("../services/stripeSubscription.service");
const SubscriptionService = require("../services/subscription.service");
const UserService = require("../services/user.service");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const stripeWebhook = (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("===========stripe error================");
    console.log(err.message);
    console.log("====================================");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const getEventData = (event) => {
    const paymentIntent = event.data.object;
    const customerId = paymentIntent.customer;
    const subscriptionId = paymentIntent.id;

    return {
      customerId,
      subscriptionId,
      paymentIntent,
    };
  };

  /**
   *
   * @Model {*} subscription
   * @Model {*} stripeSubscription
   *
   * honstly, I don't know if this is needed or not. I just copied it from the original code.
   * i don't know the difference between subscription and stripeSubscription.
   */

  const findSubscriptionInDB = async (subscriptionService, userId) => {
    return await subscriptionService.findOne({
      where: { userId: userId },
    });
  };

  const findStripeSubscriptionInDBbyUserId = async (userId) => {
    return await StripeSubscriptionService.findOne({
      where: { userId: userId },
    });
  };

  const findUserInDBbyCustomerId = async (customerId) => {
    return await UserService.getUser({ stripeId: customerId });
  };

  const findStripeProductById = async (productId) => {
    return await StripeProductService.findProduct(productId);
  };

  const updateDB = async (event) => {
    const { subscriptionId, customerId, paymentIntent } = getEventData(event);
    const userData = await findUserInDBbyCustomerId(customerId);
    if (!userData)
      throw new Error("subscribed user does not have stripe customer id in DB");

    const existingSubscription = await findStripeSubscriptionInDBbyUserId(
      userData.id
    );

    const { plan, current_period_end } = paymentIntent;
    const product = await findStripeProductById(plan.product);

    if (!product.send_credits)
      throw new Error("send_credits is not defined in the plan object");
    const documentLimit = product.send_credits;
    await db.User.update({ documentLimit }, { where: { id: userData.id } });

    const subscriptionData = {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: plan.id,
      name: product.name,
      currency: plan.currency,
      price: plan.amount / 100,
      interval: plan.interval,
      userId: userData.id,
      status: "Active", // Always set to Active for subscriptions via this method
      expiryDate: new Date(current_period_end * 1000),
    };

    if (existingSubscription) {
      await StripeSubscriptionService.update(subscriptionData, {
        where: { stripeSubscriptionId: subscriptionId },
      });
    } else {
      await StripeSubscriptionService.create(subscriptionData);
    }

    // Step 6: Update the Subscription table (if needed)
    const subscriptionService = new SubscriptionService(db.Subscription);
    const subscriptionRecord = await findSubscriptionInDB(
      subscriptionService,
      userData.id
    );

    if (subscriptionRecord) {
      await subscriptionService.update(
        { stripePlanId: plan.id },
        { where: { id: subscriptionRecord.id } }
      );
    } else {
      await subscriptionService.create({
        stripePlanId: plan.id,
        userId: userData.id,
      });
    }
  };

  const handleAction = async (event) => {
    switch (event.type) {
      case "customer.subscription.created": {
        await updateDB(event);
        console.log("created was successful!");
        break;
      }
      case "customer.subscription.updated": {
        await updateDB(event);
        console.log("updated was successful!");
        break;
      }
      case "customer.subscription.resumed": {
        const invoice = event.data.object;
        console.log("resumed was successfully:", invoice.id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  };
  handleAction(event);
};

module.exports = { stripeWebhook };
