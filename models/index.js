"use strict";
/**
 * index file used to access model from different parts of backend
 */
const fs = require("fs");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const chalk = require("chalk");
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize;

sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: false, // Disable SQL logging
  // logging: (msg) => {
  //   if (msg.startsWith("Executing (default):")) {
  //     let query = msg.replace("Executing (default):", "").trim();

  //     // Function to colorize different parts of the query
  //     function colorizeQuery(query) {
  //       return query
  //         .replace(
  //           /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AND|OR|JOIN|ON|GROUP BY|ORDER BY|LIMIT|HAVING|VALUES|SET|INNER|LEFT|RIGHT|OUTER)\b/gi,
  //           (match) => chalk.yellow(match) // SQL Keywords - Yellow
  //         )
  //         .replace(/(['`"])(.*?)\1/g, (match) => chalk.green(match)) // String values - Green
  //         .replace(/\b\d+\b/g, (match) => chalk.cyan(match)) // Numbers - Cyan
  //         .replace(/(=|<|>|\+|-|\*|\/)/g, (match) => chalk.magenta(match)) // Operators - Magenta
  //         .replace(
  //           /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi,
  //           (match) => chalk.blue(match) // UUIDs - Blue
  //         );
  //     }

  //     if (query.startsWith("SELECT")) {
  //       console.log(chalk.cyan("[SELECT]"), colorizeQuery(query));
  //     } else if (query.startsWith("INSERT")) {
  //       console.log(chalk.green("[INSERT]"), colorizeQuery(query));
  //     } else if (query.startsWith("UPDATE")) {
  //       console.log(chalk.yellow("[UPDATE]"), colorizeQuery(query));
  //     } else if (query.startsWith("DELETE")) {
  //       console.log(chalk.red("[DELETE]"), colorizeQuery(query));
  //     } else {
  //       console.log(chalk.gray(query));
  //     }
  //   } else {
  //     console.log(chalk.magenta(msg));
  //   }
  // },
});

// fs.readdirSync(__dirname)
//   .filter((file) => {
//     return (
//       file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
//     );
//   })
//   .forEach((file) => {
//     const model = require(path.join(__dirname, file))(
//       sequelize,
//       DataTypes
//     );
//     db[model.name] = model;
//   });

// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.DataTypes = DataTypes;

module.exports = db;
