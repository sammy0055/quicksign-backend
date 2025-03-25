const stripeController = {};
const StripeService = require("../services/stripe.service.js");
const StripeSubscriptionService = require("../services/stripeSubscription.service.js");

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
    return res.status(500).send(error);
  }
};

stripeController.subscribe = async (req, res) => {
  try {
    const subscription = await StripeService.subscribe(
      req.stripeId,
      req.body,
      req.userId
    );
    res.status(200).send({
      code: 200,
      message: "Your plan activated Successfully",
      data: subscription,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send(error);
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
        isDeleted: 0,
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
