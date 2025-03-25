/**
 * app.js file is run when we start the backend
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const { sequelize } = require("./models");
const path = require("path");

const app = express();

const cron = require("node-cron");
const fs = require("fs").promises;

// Middleware
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);

// Error-Handling Middleware (Must be after all routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  const errorResponse = {
    message: err.message || "Internal Server Error",
  };
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }
  res.status(statusCode).json(errorResponse);
});

// Server setup
const server = app.listen(13000, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log("App listening on http://%s:%s", host, port);
});

const socket = require("socket.io")(server, {
  cors: {
    origin: process.env.ANGULARURL,
  },
});

// Routes
const UserRoutes = require("./routes/user.routes");
const TaskRoutes = require("./routes/task.routes");
const ClientRoutes = require("./routes/client.routes");
const GroupRoutes = require("./routes/group.routes");
const SettingRoutes = require("./routes/setting.routes");
const SubscriptionRoutes = require("./routes/subscription.routes");
const StripeRoutes = require("./routes/stripe.routes");
const BillingRoutes = require("./routes/billing.routes");
const NotificationRoutes = require("./routes/notification.routes");

app.use("/users", UserRoutes);
app.use("/task", TaskRoutes);
app.use("/client", ClientRoutes);
app.use("/group", GroupRoutes);
app.use("/setting", SettingRoutes);
app.use("/subscription", SubscriptionRoutes);
app.use("/stripe", StripeRoutes);
app.use("/billing", BillingRoutes);
app.use("/notification", NotificationRoutes);

// Schedule cleanup every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const tempDir = path.join(__dirname, "uploads");
    const users = await fs.readdir(tempDir, { withFileTypes: true });

    for (const user of users) {
      if (!user.isDirectory()) continue;
      const userTempDir = path.join(tempDir, user.name, "tempTaskPdfs");
      if (!fs.existsSync(userTempDir)) continue;
      const files = await fs.readdir(userTempDir);

      for (const file of files) {
        const filePath = path.join(userTempDir, file);
        const stats = await fs.stat(filePath);
        const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

        if (ageInDays > 7) {
          await fs.unlink(filePath);
          console.log(`Deleted old file: ${filePath}`);
        }
      }
    }
    console.log("Cleanup of tempTaskPdfs completed.");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

// Socket notification function
module.exports.notification = function (type, data) {
  socket.emit(type, data);
};
