"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TaskGroup extends Model {
    static associate(models) {}
  }

  TaskGroup.init(
    {},
    {
      sequelize,
      modelName: "TaskGroup",
    }
  );
  return TaskGroup;
};

