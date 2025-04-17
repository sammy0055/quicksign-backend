const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns companyBilling Profile model
 */

module.exports = (sequelize, DataTypes) => {
  class File extends Model {}

  File.init(
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
      folderId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "file",
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pdf file",
      },
      expanded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "File",
    }
  );

  return File;
};
