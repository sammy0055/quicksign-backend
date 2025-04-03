"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate(models) {
      // Define association here
      Setting.belongsTo(models.User, {
        foreignKey: "userId", // Foreign key in the Setting model
        onDelete: "CASCADE", // Delete settings if the user is deleted
      });
    }
  }

  Setting.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true, // Validate email format
        },
      },
      replyToEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true, // Validate email format
        },
      },
      customerCommunicationDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING, // Logo URL or path
        allowNull: true,
      },
      interfaceLanguage: {
        type: DataTypes.ENUM("en", "he"),
        defaultValue: "en",
        allowNull: false,
      },
      smsSenderNameOrNumber: {
        type: DataTypes.ENUM("quickSign"),
        defaultValue: "quickSign",
        allowNull: false,
      },
      documentSenderName: {
        type: DataTypes.ENUM("quickSign"),
        defaultValue: "quickSign",
        allowNull: false,
      },
      receiveEmailUpdates: {
        type: DataTypes.ENUM("no", "withoutDocument", "withDocument"),
        defaultValue: "no",
        allowNull: false,
      },
      taxCompliance: {
        type: DataTypes.BOOLEAN, // For Income Tax guidelines
        defaultValue: false,
      },
    },

    {
      sequelize,
      modelName: "Setting",
    }
  );

  return Setting;
};


