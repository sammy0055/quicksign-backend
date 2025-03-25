const jwt = require("jsonwebtoken");
const { Task } = require("../models");

const assignAdminUserId = async (req, res, next) => {
  try {
    // Read token from query parameter 'token'
    const token = req.query.token;
    if (!token) {
      return next(new Error("Token is missing"));
    }
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.SECRET);
    const { taskId } = decoded;
    if (!taskId) {
      return next(new Error("Invalid token payload: taskId missing"));
    }
    // Look up the task using taskId
    const task = await Task.findByPk(taskId);
    if (task && task.userId) {
      req.adminUserId = task.userId;
    } else {
      req.adminUserId = null;
    }
    next();
  } catch (error) {
    console.error("Error in assignAdminUserId middleware:", error);
    next(error);
  }
};

module.exports = assignAdminUserId;
