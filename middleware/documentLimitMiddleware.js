// documentLimitMiddleware.js
const UserService = require("../services/user.service");

async function documentLimitMiddleware(req, res, next) {
  try {
    // Assuming authentication middleware attaches user info to req.user
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(403).json({ message: "User not authenticated." });
    }

    // Retrieve the full user record using your UserService
    const userRecord = await UserService.getUser({ id: userId });
    if (!userRecord) {
      return res.status(403).json({ message: "User not found." });
    }

    // Retrieve allowed document limit from the DB.
    // Free users (or users who haven't yet added a credit card/subscription) should have a limit of 3.
    // When a user purchases a plan, your business logic should update the `documentLimit` field accordingly.
    const allowedDocuments = userRecord.documentLimit || 3;

    // Retrieve how many documents the user has already sent (default to 0 if not set)
    const documentsSent = userRecord.documentsSent || 0;

    // If the user has reached or exceeded their allowed limit, block the request.
    if (documentsSent >= allowedDocuments) {
      return res.status(403).json({
        message:
          "Document sending limit reached. Please upgrade your plan to continue.",
      });
    }

    // Otherwise, allow the request to proceed
    next();
  } catch (err) {
    console.error("Error in document limit middleware:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

module.exports = documentLimitMiddleware;
