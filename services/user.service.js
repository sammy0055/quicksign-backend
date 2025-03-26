const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const StripeService = require("../services/stripe.service");
const StripeSubscriptionService = require("../services/stripeSubscription.service.js");
const { User } = require("../models/user.js");
const { Setting } = require("../models/setting.js");

db.User = User;
db.Setting = Setting;

class UserService {
  // static async createUser({
  //   firstName,
  //   lastName,
  //   email,
  //   password,
  //   role = "user",
  // }) {
  //   const existingUser = await db.User.findOne({ where: { email } });
  //   if (existingUser) {
  //     throw new Error("Email is already in use.");
  //   }

  //   const hashedPassword = await bcrypt.hash(password, 10);

  //   // Step 1: Create subscription for the user
  //   const stripeCustomer = await StripeService.createCustomer({
  //     email,
  //     firstName,
  //     lastName,
  //   });

  //   const user = await db.User.create({
  //     id: uuidv4(),
  //     firstName,
  //     lastName,
  //     email,
  //     password: hashedPassword,
  //     role,
  //     stripeId: stripeCustomer.id,
  //   });

  //   // Step 2 Create default settings for the user
  //   const defaultSettings = {
  //     userId: user.id,
  //     businessName: "My Business",
  //     customerEmail: email,
  //     replyToEmail: email,
  //     interfaceLanguage: "en",
  //     smsSenderNameOrNumber: "quickSign",
  //     documentSenderName: "quickSign",
  //     receiveEmailUpdates: "no",
  //     taxCompliance: false,
  //     customerCommunicationDetails: "",
  //     signature: "",
  //   };

  //   await Setting.create(defaultSettings);

  //   return { id: user.id, name: user.name, email: user.email, role: user.role };
  // }

  static async testDB() {
    try {
      // await db.sequelize.authenticate();

      // const user = await db.User.create({
      //   id: uuidv4(),
      //   firstName: "mzeee",
      //   lastName: "loook",
      //   email: "samko@gmail.com",
      //   password: "hashedPassword",
      //   role: "User",
      //   stripeId: "stripeCustomerdddd",
      // });
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  }

  static async freezeUser(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

     await db.User.update(
      { status: "freezed" },
      { where: { id: userId } }
    );
    return await db.User.findByPk(userId);
  }

  static async disconnectUser(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

     await db.User.update(
      { status: "inactive" },
      { where: { id: userId } }
    );

    return await db.User.findByPk(userId);
  }

  static async activateUser(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

     await db.User.update(
      { status: "active" },
      { where: { id: userId } }
    );

    return await db.User.findByPk(userId);
  }

  static async createUser({
    firstName,
    lastName,
    email,
    password,
    role = "User",
  }) {
    // Step 1: Create Stripe customer
    let stripeCustomer;
    try {
      stripeCustomer = await StripeService.createCustomer({
        email,
        firstName,
        lastName,
      });
    } catch (error) {
      console.error("Failed to create Stripe customer:", error);
      throw error;
    }

    // Step 2: Create user and settings in a transaction
    const transaction = await db.sequelize.transaction();
    let user;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await db.User.create(
        {
          id: uuidv4(),
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role,
          stripeId: stripeCustomer.id,
        },
        { transaction }
      );

      const defaultSettings = {
        userId: user.id,
        businessName: "My Business",
        customerEmail: email,
        replyToEmail: email,
        interfaceLanguage: "en",
        smsSenderNameOrNumber: "quickSign",
        documentSenderName: "quickSign",
        receiveEmailUpdates: "no",
        taxCompliance: false,
        customerCommunicationDetails: "",
        signature: "",
      };
      await db.Setting.create(defaultSettings, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (stripeCustomer && stripeCustomer.id) {
        try {
          await StripeService.deleteCustomer(stripeCustomer.id);
        } catch (cleanupError) {
          console.error("Cleanup failed:", cleanupError);
        }
      }
      console.error("Error creating user or settings:", error);
      throw error;
    }

    // Step 3: Create trial subscription and save it
    try {
      const trialPlanPriceId = process.env.STRIPE_TRIAL_PRICE_ID; // Ensure this is set in .env
      const trialPeriodDays = 7;
      const stripeSubscription = await StripeService.createTrialSubscription({
        customerId: stripeCustomer.id,
        priceId: trialPlanPriceId,
        trialPeriodDays,
      });

      const subscriptionData = {
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0].price.id,
        price: stripeSubscription.items.data[0].price.unit_amount_decimal / 100,
        name: stripeSubscription.items.data[0].price.nickname || "Trial",
        currency: stripeSubscription.items.data[0].price.currency,
        interval: stripeSubscription.items.data[0].plan.interval,
        expiryDate: new Date(stripeSubscription.current_period_end * 1000),
        status: stripeSubscription.trial_end
          ? "Trial"
          : stripeSubscription.status, // Keep Trial status here
        isDeleted: false,
        userId: user.id,
      };

      await StripeSubscriptionService.create(subscriptionData);

      // Set reduced document limit for trial users
      await db.User.update({ documentLimit: 10 }, { where: { id: user.id } });

      return { id: user.id, email: user.email, role: user.role };
    } catch (error) {
      console.error("Error creating trial subscription:", error);
      throw error;
    }
  }

  static async createUserWithGoogle({
    firstName,
    lastName,
    email,
    googleId,
    role = "user",
  }) {
    let user = await db.User.findOne({ where: { email } });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      return { id: user.id, email: user.email, role: user.role };
    }

    const stripeCustomer = await StripeService.createCustomer({
      email,
      firstName,
      lastName,
    });

    // Generate a dummy password to satisfy NOT NULL constraint
    const dummyPassword = await bcrypt.hash(`google_${googleId}`, 10); // Unique per Google ID

    user = await db.User.create({
      id: uuidv4(),
      firstName,
      lastName,
      email,
      googleId,
      password: dummyPassword, // Set dummy password
      role,
      stripeId: stripeCustomer.id,
    });

    const defaultSettings = {
      userId: user.id,
      businessName: "My Business",
      customerEmail: email,
      replyToEmail: email,
      interfaceLanguage: "en",
      smsSenderNameOrNumber: "quickSign",
      documentSenderName: "quickSign",
      receiveEmailUpdates: "no",
      taxCompliance: false,
      customerCommunicationDetails: "",
      signature: "",
    };

    await db.Setting.create(defaultSettings);

    return { id: user.id, email: user.email, role: user.role };
  }

  static async getUsers(page = 1, limit = 6) {
    // Convert to numbers to avoid issues with string inputs
    page = parseInt(page);
    limit = parseInt(limit);

    // Calculate offset (skip) value
    const offset = (page - 1) * limit;

    // Get total user count
    const totalUsers = await User.count();

    // Fetch users with pagination
    const users = await User.findAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]], // Optional: Sort by newest first
    });

    // Check if there are more results to fetch
    const hasMore = offset + users.length < totalUsers;

    return {
      totalUsers,
      page,
      limit,
      hasMore,
      users,
    };
  }

  static async getUserByEmailOrId({ id, email } = {}) {
    let whereCondition = {};

    // Add conditions based on provided parameters
    if (id) whereCondition.id = id;
    if (email) whereCondition.email = email;

    // Find user(s) based on conditions
    const user = await User.findOne({ where: whereCondition });

    if (!user) {
      throw new Error("User not found")
    }

    return user;
  }

  static async getUser(whereClause) {
    return await db.User.findOne({ where: whereClause });
  }

  static async getUserByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  static async deleteUser(id) {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new Error("User not found.");
    }
    await db.User.destroy({ where: { id } });
  }

  static async findOne(whereClause) {
    return await User.findOne(whereClause);
  }

  static async changeUserPassword({ id, currentPassword, newPassword }) {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new Error("User not found.");
    }

    const passwordIsValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!passwordIsValid) {
      throw new Error("Current password is incorrect.");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.User.update({ password: hashedNewPassword }, { where: { id } });
  }

  static async getUserInfo(id) {
    const user = await db.User.findByPk(id, {
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "documentLimit",
      ],
      // Optionally include related data if needed
      include: [
        {
          model: db.Setting,
          attributes: [
            "businessName",
            "customerEmail",
            "replyToEmail",
            "interfaceLanguage",
          ], // Select specific settings fields
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}

module.exports = UserService;
