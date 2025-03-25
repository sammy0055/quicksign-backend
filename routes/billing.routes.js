const express = require("express");
const router = express.Router();
const { Billing } = require("../models");
const BillingService = require("../services/billing.service");
const BillingController = require("../controllers/billing.controller");
const checkAuth = require("../middleware/verifyJwtToken");

// Instantiate the service and controller
const billingService = new BillingService(Billing);
const billingController = new BillingController(billingService);

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// CRUD Routes for Billing using asyncHandler

// Create a new billing record
router.post(
  "/create",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(billingController.createBilling.bind(billingController))
);

// Get billing details for the authenticated user
router.post(
  "/get_user_billing",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(billingController.getBillingByUser.bind(billingController))
);

// Update a billing record by its ID
router.put(
  "/update/:id",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(billingController.updateBilling.bind(billingController))
);

// Delete a billing record by its ID
router.delete(
  "/delete/:id",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(billingController.deleteBilling.bind(billingController))
);

module.exports = router;
