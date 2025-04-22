"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Submission extends Model {
    static associate(models) {
      Submission.belongsTo(models.Task, { foreignKey: "taskId", as: "task" });
      // Submission.belongsTo(models.Client, {
      //   foreignKey: "clientId",
      //   as: "client",
      //   constraints: false, // ⛔ disables foreign key constraint
      // });
    }
  }

  Submission.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      clientId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Submission",
      // tableName: "submissions",
      timestamps: false,
    }
  );

  return Submission;
};


