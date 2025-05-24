"use strict";
/**
 * index file used to access model from different parts of backend
 */
// const fs = require("fs");
// const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");
// const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
// const chalk = require("chalk");
const config = require(__dirname + "/../config/config.js")[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    ...config,
    logging: false, // Disable SQL logging
  }
);

// systme user
const systemAdminUser = require("./systemAdminUser")(sequelize, DataTypes);
// initialize all models
const User = require("./user")(sequelize, DataTypes);
const Billing = require("./billing")(sequelize, DataTypes);
const Client = require("./client")(sequelize, DataTypes);
const Group = require("./group")(sequelize, DataTypes);
const StripeSubscription = require("./stripeSubscription")(
  sequelize,
  DataTypes
);
const Task = require("./task")(sequelize, DataTypes);
const TaskClient = require("./taskClient")(sequelize, DataTypes);
const TaskGroup = require("./taskGroup")(sequelize, DataTypes);
const Submission = require("./submission")(sequelize, DataTypes);
const Setting = require("./setting")(sequelize, DataTypes);
const Notification = require("./notification")(sequelize, DataTypes);
const GroupClient = require("./groupClient")(sequelize, DataTypes);
const stripeProduct = require("./stripeProduct")(sequelize, DataTypes);
const pdfTemplate = require("./pdfTemplate")(sequelize, DataTypes);
const Company = require("./company")(sequelize, DataTypes);
const Folder = require("./folder")(sequelize, DataTypes);
const File = require("./File")(sequelize, DataTypes);

User.associate({
  Client,
  Group,
  Task,
  Setting,
  StripeSubscription,
  Billing,
  Notification,
});

Client.associate({ Task, Group, Submission, User });
Group.associate({ User, Client, Task });
Notification.associate({ User, Task });
Billing.associate({ User });
Setting.associate({ User });
StripeSubscription.associate({ User });
Submission.associate({ Task, Client });
Task.associate({ User, Client, Group, Notification, Submission });
GroupClient.associate({});
TaskGroup.associate({});
TaskClient.associate({});

const db = {
  sequelize,
  Sequelize,
  systemAdminUser,
  User,
  Billing,
  Client,
  Group,
  StripeSubscription,
  stripeProduct,
  Task,
  TaskClient,
  TaskGroup,
  Submission,
  Setting,
  Notification,
  GroupClient,
  pdfTemplate,
  Company,
  Folder,
  File,
};

module.exports = db;
