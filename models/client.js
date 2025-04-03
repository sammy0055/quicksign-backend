"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      // Client.belongsTo(models.Group, { foreignKey: "groupId" });
      Client.belongsToMany(models.Task, { through: "TaskClient" });
      Client.belongsToMany(models.Group, {
        through: "GroupClient",
      });
      Client.hasMany(models.Submission, { foreignKey: "clientId" });
      Client.belongsTo(models.User, { foreignKey: "userId" });
    }
  }

  Client.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyName: {
        // Added company/business name
        type: DataTypes.STRING,
        allowNull: true,
      },

      city: {
        // Added city
        type: DataTypes.STRING,
        allowNull: true,
      },
      street: {
        // Added street
        type: DataTypes.STRING,
        allowNull: true,
      },
      streetNumber: {
        // Added street number
        type: DataTypes.STRING,
        allowNull: true,
      },
      entranceNumber: {
        // Added entrance number
        type: DataTypes.STRING,
        allowNull: true,
      },
      fullAddress: {
        // Added full address
        type: DataTypes.STRING,
        allowNull: true,
      },
      companyStamp: {
        // Added company stamp
        type: DataTypes.STRING,
        allowNull: true,
      },
    },

    {
      sequelize,
      modelName: "Client",
    }
  );
  return Client;
};


