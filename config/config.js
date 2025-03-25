/**
 * config module
 * @module config
 */
/**
 * dotenv library to include env file in our config file
 */
require("dotenv").config();

module.exports = {
  /**
   * data required for development database
   */
  development: {
    /**
     * username of database  passed from env file
     */
    username: process.env.USER_NAME,
    /**
     * password of database passed from env file
     */
    password: process.env.PASSWORD,
    /**
     * name of database passed from env file
     */
    database: process.env.DATA_BASE,
    /**
     * host of database passed from env file
     */
    host: process.env.HOST,
    /**
     * port of database passed from env file
     */
    port: process.env.PORT,
    /**
     * dialect of database passed from env file
     */
    dialect: "mysql",
    /**
     * pool of database passed from env file
     */
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  /**
   * data required for staging database
   */
  staging: {
    /**
     * username of database  passed from env file
     */
    username: process.env.USER_NAME,
    /**
     * password of database passed from env file
     */
    password: process.env.PASSWORD,
    /**
     * name of database passed from env file
     */
    database: process.env.DATA_BASE,
    /**
     * host of database passed from env file
     */
    host: process.env.HOST,
    /**
     * port of database passed from env file
     */
    port: process.env.PORT,
    /**
     * dialect of database passed from env file
     */
    dialect: "mysql",
    /**
     * pool of database passed from env file
     */
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  /**
   * data required for production database
   */
  production: {
    /**
     * username of database  passed from env file
     */
    username: process.env.USER_NAME,
    /**
     * password of database passed from env file
     */
    password: process.env.PASSWORD,
    /**
     * name of database passed from env file
     */
    database: process.env.DATA_BASE,
    /**
     * host of database passed from env file
     */
    host: process.env.HOST,
    /**
     * port of database passed from env file
     */
    port: process.env.PORT,
    /**
     * dialect of database passed from env file
     */
    dialect: "mysql",
    /**
     * pool of database passed from env file
     */
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
