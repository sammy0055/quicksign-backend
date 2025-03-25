"use strict";
/**
 * include model from sequelize
 */
const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns   subscription model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * Class to create a   subscription object
   */
  class Subscription extends Model {
    static associate(models) {
      // define association here
      Subscription.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }

  Subscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      stripePlanId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        allowNull: false,
      },
    },
    /**
     * name of the model
     */
    {
      sequelize,
      modelName: "Subscription",
    }
  );
  return Subscription;
};
