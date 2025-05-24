/**
 * Company_Profile_Routes module
 * @module Company_Profile_Routes
 */
/**
 * the routings for Company Profile functions are written in this file
 */
/**
 * functions refernece return
 */
const express = require("express");
/**
 * functions refernece call for router
 */
const router = express.Router();
/**
 * including user Controller object to access controller functions
 */
const StripeController = require("../controllers/stripe.controller");

/**
 * middleware to check api token for security imported to use in routes
 */
const checkAuth = require("../middleware/verifyJwtToken");

router.post("/subscribe", [checkAuth.verifyToken], StripeController.subscribe);
router.post(
  "/resume_subscription",
  [checkAuth.verifyToken],
  StripeController.resumeSubscription
);
router.get(
  "/get_subscriptions",
  [checkAuth.verifyToken],
  StripeController.getSubscriptions
);

/**
 * post type router call to check user email
 */
/**
 * Documentaion for an Router Object
 * router Object is exported to be used in other files
 * @router
 */
module.exports = router;
