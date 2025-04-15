const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const StripeService = require("../services/stripe.service");
const StripeSubscriptionService = require("../services/stripeSubscription.service.js");

class UserService {
  static async registerCompanyUser(userData, userId) {
    const { email, password, displayName, role, status } = userData;
    const allowedRoles = ["User", "Admin"];
    if (!password || !email)
      throw new Error("password or email is not correct");
    if (role && !allowedRoles.includes(role))
      throw new Error("selected role is not allowed");

    const existingCompany = await db.User.findOne({
      where: { id: userId },
    });

    const companyId = existingCompany.companyId;
    if (!companyId)
      throw new Error("access denied, no organization for this user");

    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) throw new Error("User with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      id: uuidv4(),
      companyId,
      displayName,
      email,
      password: hashedPassword,
      role: role || "User",
      status,
    });

    return user;
  }

  static async updateCompanyUserInfo(userData) {
    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      userData.password = hashedPassword;
    }
    await db.User.update(userData, { where: { id: userData.userId } });
    return await db.User.findByPk(userData.userId);
  }

  static async createUser({ firstName, lastName, email, password, role }) {
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
          companyId: uuidv4(),
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
    role = "Super-Admin",
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
      companyId: uuidv4(),
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

  static async getUsers({ page = 1, limit = 3, userId }) {
    // Convert to numbers to avoid issues with string inputs
    page = parseInt(page);
    limit = parseInt(limit);

    // Calculate offset (skip) value
    const offset = (page - 1) * limit;

    // Get total user count
    const totalUsers = await db.User.count();
    const user = await db.User.findByPk(userId);
    if (!user) throw new Error("user does not exist");

    // Fetch users with pagination
    const users = await db.User.findAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]], // Optional: Sort by newest first
      where: {
        companyId: user.companyId,
      },
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
    const user = await db.User.findOne({ where: whereCondition });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  static async getUser(whereClause) {
    return await db.User.findOne({ where: whereClause });
  }

  static async getUserByEmail(email) {
    return await db.User.findOne({ where: { email } });
  }

  static async deleteUser(id) {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new Error("User not found.");
    }
    await db.User.destroy({ where: { id } });
  }

  static async findOne(whereClause) {
    return await db.User.findOne(whereClause);
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
