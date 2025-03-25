const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/verifyJwtToken");

const SubscriptionService = require("../services/subscription.service");
const SubscriptionController = require("../controllers/subscription.controller");

// Import the Subscription model from your models
const { Subscription } = require("../models");

// Instantiate the service and controller
const subscriptionService = new SubscriptionService(Subscription);
const subscriptionController = new SubscriptionController(subscriptionService);

// Async handler middleware similar to the one used in the Client routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post(
  "/get_user_plan",
  checkAuth.verifyToken,
  asyncHandler(
    subscriptionController.getUserSubscriptionPlan.bind(subscriptionController)
  )
);

router.post(
  "/check_subscription",
  checkAuth.verifyToken,
  asyncHandler(
    subscriptionController.checkSubscription.bind(subscriptionController)
  )
);

module.exports = router;
