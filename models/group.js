"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsTo(models.User, { foreignKey: "userId" });
      Group.belongsToMany(models.Client, { through: "GroupClient" });
      Group.belongsToMany(models.Task, { through: "TaskGroup" });
    }
  }

  Group.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      signatureRoutine: {
        type: DataTypes.ENUM("parallel ", "sequential"),
        defaultValue: "parallel",
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Group",
    }
  );
  return Group;
};
