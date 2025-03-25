const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const checkAuth = require("../middleware/verifyJwtToken");
const authPublicToken = require("../middleware/verifyPublicToken");
const upload = require("../helpers/fileUpload");
const assignAdminUserId = require("../middleware/assignAdminUserId");

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Fixed routes without .bind() since controllers are functions
router.post(
  "/get_all_task",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(taskController.getAllTasks)
);

router.post(
  "/get_by_id",
  [authPublicToken.verifyToken],
  asyncHandler(taskController.getTaskById)
);

router.get(
  "/pdf",
  [authPublicToken.verifyToken],
  asyncHandler(taskController.getTaskPdf)
);

router.get(
  "/get_all_saved_pdf_info",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(taskController.getAllSavedPdfInfo)
);

router.post(
  "/create_task",
  [
    checkAuth.verifyToken,
    checkAuth.verifyUserRole(["Admin"]),
    upload.single("taskPdf"),
  ],
  asyncHandler(taskController.createTask)
);

router.put(
  "/:id",
  [
    checkAuth.verifyToken,
    checkAuth.verifyUserRole(["Admin"]),
    upload.single("taskPdf"),
  ],
  asyncHandler(taskController.updateTask)
);

router.delete(
  "/:id",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(taskController.deleteTask)
);

// Keep non-asyncHandler routes as-is for non-promise based controllers
router.post(
  "/dashboard",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  taskController.getDashboardData
);

router.post(
  "/open-task",
  [authPublicToken.verifyToken],
  taskController.openTask
);

router.post(
  "/submit",
  assignAdminUserId,
  upload.single("editedPdf"),
  taskController.submitTask
);

module.exports = router;
