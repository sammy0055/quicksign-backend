"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GroupClient extends Model {
    static associate(models) {}
  }

  GroupClient.init(
    {},
    {
      sequelize,
      modelName: "GroupClient",
    }
  );
  return GroupClient;
};

