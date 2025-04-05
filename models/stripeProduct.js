const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns companyBilling Profile model
 */

module.exports = (sequelize, DataTypes) => {
  class StripeProduct extends Model {}

  StripeProduct.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false, // More random
        primaryKey: true,
      },
      default_price: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "usd",
      },
      interval: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      features: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      send_credits: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "StripeProduct",
    }
  );

  return StripeProduct;
};
