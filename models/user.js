"use strict";
/**
 * include model from sequelize
 */
const { Model } = require("sequelize");
/**
 * exporting model to create
 * @param sequelize sequelize library
 * @param DataTypes data type of the fields in table
 * @returns User model
 */
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Client, { foreignKey: "userId" });
      User.hasMany(models.Group, { foreignKey: "userId" });
      User.hasMany(models.Task, { foreignKey: "userId" });
      User.hasOne(models.Setting, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
      User.hasOne(models.StripeSubscription, { foreignKey: "userId" });
      User.hasOne(models.Subscription, {
        foreignKey: "userId",
      });
      User.hasMany(models.Billing, {
        foreignKey: "userId",
      });
      User.hasMany(models.Notification, {
        foreignKey: "userId",
      });
    }
  }

  /**
   * User model data
   */
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Optional, more random than UUIDV1
        primaryKey: true,
      },
      /**
       * firstName of the user
       */
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      /**
       * lastName of the user
       */
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      /**
       * email of the user
       */
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      /**
       * login password of the user
       */
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      /**
       * role of the user
       */
      role: {
        type: DataTypes.ENUM,
        values: ["User", "Admin", "Super Admin"],
        allowNull: false,
        defaultValue: "User",
      },
      /**
       * role of the user
       */
      status: {
        type: DataTypes.ENUM,
        values: ["active", "inactive", "freezed"],
        allowNull: false,
        defaultValue: "active",
      },
      /**
       * Stripe Customer ID for the user
       */
      stripeId: {
        type: DataTypes.STRING,
        allowNull: true, // User may not have a Stripe customer ID initially
        unique: true,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },

      documentLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },

    /**
     * name of the model
     */
    {
      sequelize,
      modelName: "User",
    }
  );

  return User;
};

