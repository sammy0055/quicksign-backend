"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TaskClient extends Model {
    static associate(models) {}
  }

  TaskClient.init(
    {},
    {
      sequelize,
      modelName: "TaskClient",
    }
  );
  return TaskClient;
};

