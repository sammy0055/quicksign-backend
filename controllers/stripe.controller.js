const stripeController = {};
const { stripe_package_plans } = require("../data/stripe-packages.js");
const StripeService = require("../services/stripe.service.js");
const {
  StripeProductService,
} = require("../services/stripeProduct.service.js");
const StripeSubscriptionService = require("../services/stripeSubscription.service.js");

stripeController.subscribe = async (req, res) => {
  try {
    const productId = req.body.id;
    if (!productId) throw new Error("Product Id is required");
    const plan = stripe_package_plans.find(({ id }) => id === productId);
    if (!plan) throw new Error("Product not found");
    const subscription = await StripeService.subscribe(
      req.stripeId, //stripeId is customer id
      plan, // product package to subscribe to
      req.userId
    );
    res.status(200).json({
      data: subscription,
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ error: { message: error.message, code: "subscription-failed" } });
  }
};

stripeController.resumeSubscription = async (req, res) => {
  try {
    const subscription = await StripeService.resumeSubscription(
      req.body,
      req.stripeId
    );
    res.status(200).send({
      code: 200,
      message: "Your Subscription has been resumed Successfully",
      data: subscription,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send(error);
  }
};

stripeController.getSubscriptions = async (req, res) => {
  try {
    const whereClause = {
      where: {
        userId: req.userId,
        isDeleted: false,
      },
    };
    let subscriptionsData = await StripeSubscriptionService.findOne(
      whereClause
    );
    if (subscriptionsData) {
      const checkSubscription = await StripeService.checkSubscriptionStatus(
        subscriptionsData
      );
      subscriptionsData = checkSubscription;
    }
    res.status(200).send({
      code: 200,
      // message: "Subscriptions Data Retrieved Successfully",
      data: subscriptionsData,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send(error);
  }
};

module.exports = stripeController;
