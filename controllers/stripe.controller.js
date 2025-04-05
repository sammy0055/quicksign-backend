const stripeController = {};
const StripeService = require("../services/stripe.service.js");
const {
  StripeProductService,
} = require("../services/stripeProduct.service.js");
const StripeSubscriptionService = require("../services/stripeSubscription.service.js");

stripeController.createPlan = async (req, res) => {
  try {
    const stripePlan = await StripeService.createMonthlyPlan(req.body);
    res.status(200).send({
      code: 200,
      message: "Stripe Plan Created Successfully",
      data: stripePlan,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ error: { message: error.message } });
  }
};

stripeController.editPlan = async (req, res) => {
  try {
    const stripePlan = await StripeService.editPlan(req.body);
    res.status(200).json({
      code: 200,
      message: "Stripe Plan Edited Successfully",
      data: stripePlan,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ error: { message: error.message } });
  }
};

stripeController.archivePlan = async (req, res) => {
  try {
    const productId = req.query.productId;
    if (!productId) throw new Error("Product Id is required");
    const stripePlan = await StripeService.archivePlan(productId);
    res.status(200).json({
      code: 200,
      message: "Stripe Plan Archived Successfully",
      data: stripePlan,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ error: { message: error.message } });
  }
};

stripeController.addCard = async (req, res) => {
  try {
    const stripeAddCard = await StripeService.addPaymentMethod(
      req.body,
      req.stripeId
    );
    res.status(200).send({
      code: 200,
      message: "Stripe Card Added Successfully",
      data: stripeAddCard,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send(error);
  }
};

stripeController.getCards = async (req, res) => {
  try {
    const stripeCards = await StripeService.getCustomerPaymentMethods(
      req.stripeId
    );
    res.status(200).send({
      code: 200,
      // message: "Stripe Cards Retreived Successfully",
      data: stripeCards,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send(error);
  }
};

stripeController.getPlans = async (req, res) => {
  try {
    const stripePlans = await StripeService.getPlans();
    res.status(200).send({
      code: 200,
      // message: "Stripe Plans Retreived Successfully",
      data: stripePlans,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({ error: { message: error.message } });
  }
};

stripeController.subscribe = async (req, res) => {
  try {
    const productId = req.body.productId;
    if (!productId) throw new Error("Product Id is required");
    const plan = await StripeProductService.findProduct(productId);
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
