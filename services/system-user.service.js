const bcryptjs = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../models");
const jwt = require("jsonwebtoken");

class SystemUserService {
  static login = async ({ email, password }) => {
    if (!email || !password) throw new Error("Email and password are required");

    const user = await db.systemAdminUser.findOne({ where: { email } });

    if (!user) throw new Error("Incorrect email or password");

    const passwordIsValid = await bcryptjs.compare(password, user.password);
    if (!passwordIsValid) throw new Error("Incorrect email or password");

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.firstName + " " + user.lastName,
        stripeId: user.stripeId,
      },
      process.env.SECRET,
      { expiresIn: "1h" }
    );
    const decoded = jwt.decode(token);
    return {
      user,
      token,
      expiresAt: decoded.exp,
    };
  };
  static async createSytemUser({
    firstName,
    lastName,
    email,
    password,
    role = "Admin",
  }) {
    const hashedPassword = await bcryptjs.hash(password, 10);
    return await db.systemAdminUser.create({
      id: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });
  }

  static async testDB() {
    try {
      // await db.sequelize.authenticate();

      // const user = await db.systemAdminUser.create({
      //   id: uuidv4(),
      //   firstName: "mzeee",
      //   lastName: "loook",
      //   email: "samko@gmail.com",
      //   password: "hashedPassword",
      //   role: "Admin",
      //   stripeId: "stripeCustomerdddd",
      // });
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  }

  static async freezeUser(userId) {
    const user = await db.systemAdminUser.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    await db.systemAdminUser.update(
      { status: "freezed" },
      { where: { id: userId } }
    );
    return await db.systemAdminUser.findByPk(userId);
  }

  static async disconnectUser(userId) {
    const user = await db.systemAdminUser.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    await db.systemAdminUser.update(
      { status: "inactive" },
      { where: { id: userId } }
    );

    return await db.systemAdminUser.findByPk(userId);
  }

  static async activateUser(userId) {
    const user = await db.systemAdminUser.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    await db.systemAdminUser.update(
      { status: "active" },
      { where: { id: userId } }
    );

    return await db.systemAdminUser.findByPk(userId);
  }
}

module.exports = { SystemUserService };
