const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns companyBilling Profile model
 */

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {}

  Company.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Optional, more random than UUIDV1
        primaryKey: true,
      },
      rootUser: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      documentLimit: {
        type: DataTypes.INTEGER,
        default: 5,
      },
    },
    {
      sequelize,
      modelName: "Company",
    }
  );

  return Company;
};
