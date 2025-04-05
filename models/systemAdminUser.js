const { Model } = require("sequelize");

/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns User model
 */

module.exports = (sequelize, DataTypes) => {
  class SystemAdminUser extends Model {}

  SystemAdminUser.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Optional, more random than UUIDV1
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM,
        values: ["Admin", "Moderator", "Editor"],
        allowNull: false,
        defaultValue: "Admin",
      },
    },
    {
      sequelize,
      modelName: "SystemAdminUser",
    }
  );

  return SystemAdminUser;
};
