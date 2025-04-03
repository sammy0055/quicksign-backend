"use strict";
/**
 * include model from sequelize
 */
const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns billing Profile model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * Class to create a Billing object
   */
  class Billing extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Billing.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }
  /**
   * Billing model data
   */
  Billing.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
      },
      /**
       * billingEmail of the billing
       */
      billingEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      /**
       * cardNumber of the billing
       */
      cardNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      /**
       * cardType of the billing
       */
      cardType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      /**
       * expiryDate of the billing
       */
      expiryDate: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      /**
       * status of the billing
       */
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    /**
     * name of the model
     */
    {
      sequelize,
      modelName: "Billing",
    }
  );
  return Billing;
};

