const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns companyBilling Profile model
 */

module.exports = (sequelize, DataTypes) => {
  class Folder extends Model {}

  Folder.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Optional, more random than UUIDV1
        primaryKey: true,
      },
      companyId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "folder",
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "folder for pdf files",
      },
      expanded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      children: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "Folder",
    }
  );

  return Folder;
};
