const express = require("express");
const router = express.Router();
const ClientService = require("../services/client.service");
const ClientController = require("../controllers/client.controller");
const checkAuth = require("../middleware/verifyJwtToken");

// Instantiate the service and controller
const clientService = new ClientService();
const clientController = new ClientController(clientService);

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
router.post(
  "/get_all_clients",
  checkAuth.verifyToken,
  asyncHandler(clientController.getAllClients.bind(clientController))
);

router.post(
  "/get_client_by_id",
  checkAuth.verifyToken,
  asyncHandler(clientController.getClientById.bind(clientController))
);
router.post(
  "/",
  checkAuth.verifyToken,
  asyncHandler(clientController.createClient.bind(clientController))
);
router.post(
  "/bulk",
  checkAuth.verifyToken,
  asyncHandler(clientController.createMultipleClients.bind(clientController))
);
router.put(
  "/:id",
  checkAuth.verifyToken,
  asyncHandler(clientController.updateClient.bind(clientController))
);
router.delete(
  "/:id",
  checkAuth.verifyToken,
  asyncHandler(clientController.deleteClient.bind(clientController))
);

module.exports = router;
