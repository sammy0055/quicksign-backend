"use strict";
/**
 * include model from sequelize
 */
const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns companyBilling Profile model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * Class to create a CompanyBilling object
   */
  class StripeSubscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StripeSubscription.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: "id", // Ensure it maps to the 'id' column in Users
        onDelete: "CASCADE",
      });
    }
  }
  /**
   * CompanyBilling model data
   */
  StripeSubscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // More random
        primaryKey: true,
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stripePriceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      interval: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "Not Active",
          "Active",
          "Trial",
          "Expired",
          "canceled",
          "past_due"
        ),
        defaultValue: "Trial",
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
      modelName: "StripeSubscription",
    }
  );
  return StripeSubscription;
};
