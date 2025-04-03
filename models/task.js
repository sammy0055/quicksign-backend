"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: "userId" });

      // creates the junction table
      Task.belongsToMany(models.Client, { through: "TaskClient" });
      Task.belongsToMany(models.Group, { through: "TaskGroup" });

      Task.hasMany(models.Notification, {
        foreignKey: "taskId",
      });
      Task.hasMany(models.Submission, { foreignKey: "taskId" });
    }
  }

  Task.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      documentName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("sent", "opened", "signed", "failed"),
        defaultValue: "sent",
      },
      channel: {
        type: DataTypes.ENUM("email", "sms"),
        allowNull: false,
      },
      additionalNote: {
        type: DataTypes.STRING,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false, // URL of the uploaded PDF file
      },
      isSaved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },

    {
      sequelize,
      modelName: "Task",
    }
  );
  return Task;
};

