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
const {
  validatePlanInput,
  validateEditPlanInput,
} = require("../middleware/manage-subscription");
router.post("/add_card", [checkAuth.verifyToken], StripeController.addCard);
router.get("/get_cards", [checkAuth.verifyToken], StripeController.getCards);
router.get("/get_plans", [checkAuth.verifyToken], StripeController.getPlans); // add back [checkAuth.verifyToken],
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

router.post("/create-plan", [checkAuth.verifyToken], validatePlanInput, StripeController.createPlan); // add back [checkAuth.verifyToken],
router.post("/edit-plan", [checkAuth.verifyToken], validateEditPlanInput, StripeController.editPlan); // add back [checkAuth.verifyToken],
router.get("/archive-plan", [checkAuth.verifyToken], StripeController.archivePlan); // add back [checkAuth.verifyToken],

/**
 * post type router call to check user email
 */
/**
 * Documentaion for an Router Object
 * router Object is exported to be used in other files
 * @router
 */
module.exports = router;
