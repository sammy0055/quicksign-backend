const UserService = require("../services/user.service");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");
const e = require("express");
const db = require("../models");
const { v4: uuidv4 } = require("uuid");
const client = new OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID); // Replace with your Google Client ID
const JWT_SECRET = "your-jwt-secret";

class UserController {
  static async registerWithGoogle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        role = "Super-Admin",
        googleIdToken,
      } = req.body;

      // Check if user already exists
      let existingUser = await UserService.getUserByEmail(email);
      const ticket = await client.verifyIdToken({
        idToken: googleIdToken,
        audience: process.env.GOOGLE_AUTH_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!ticket) throw new Error("authentication failed");
      if (existingUser) {
        // login user and respond
        if (payload.email !== email) {
          return res
            .status(400)
            .json({ error: "Email mismatch with Google token" });
        }

        // Find user by email or Google ID
        const user = await UserService.findOne({ where: { email } });
        if (!user) {
          return res
            .status(401)
            .json({ error: "User not found. Please sign up first." });
        }

        // Optionally check googleId if stored
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(401).json({ error: "Google ID mismatch" });
        }

        // Generate JWT for both flows
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
          { expiresIn: "3h" }
        );
        const decoded = jwt.decode(token);
        return res.status(200).json({
          message: "User logged in successfully.",
          data: {
            user,
            token,
            expiresAt: decoded.exp,
          },
        });
      } else {
        const user = await UserService.createUserWithGoogle({
          firstName,
          lastName,
          email,
          googleId: payload.sub,
          role,
        });

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.SECRET || "your-jwt-secret",
          { expiresIn: "1h" }
        );

        const decoded = jwt.decode(token);
        return res.status(200).json({
          message: "User logged in successfully.",
          data: {
            message: "User logged in successfully.",
            user,
            token,
            expiresAt: decoded.exp,
          },
        });
      }
    } catch (error) {
      res.status(500).json({ error: { message: error.message } });
    }
  }
  static async registerUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role = "Super-Admin",
      googleIdToken,
    } = req.body;

    try {
      // Check if user already exists
      let existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User with this email already exists." });
      }

      let user;
      if (googleIdToken) {
        const ticket = await client.verifyIdToken({
          idToken: googleIdToken,
          audience: process.env.GOOGLE_AUTH_CLIENT_ID, // Must match frontend Client ID
        });
        const payload = ticket.getPayload();

        if (payload.email !== email) {
          return res
            .status(400)
            .json({ error: "Email mismatch with Google token" });
        }

        user = await UserService.createUserWithGoogle({
          firstName,
          lastName,
          email,
          googleId: payload.sub,
          role,
        });

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.SECRET || "your-jwt-secret",
          { expiresIn: "1h" }
        );

        const decoded = jwt.decode(token);
        return res.status(200).json({
          message: "User logged in successfully.",
          data: {
            message: "User logged in successfully.",
            user,
            token,
            expiresAt: decoded.exp,
          },
        });
      } else {
        if (!password) {
          return res
            .status(400)
            .json({ error: "Password is required for non-Google signup" });
        }

        user = await UserService.createUser({
          firstName,
          lastName,
          email,
          password,
          role,
        });

        return res.status(201).json({
          message: "User registered successfully.",
          user,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async registerCompanyUser(req, res) {
    try {
      const data = await UserService.registerCompanyUser(req.body, req.userId);
      return res.status(201).json({
        data,
      });
    } catch (error) {
      return res.status(500).json({ error: { message: error.message } });
    }
  }

  static async updateCompanyUserInfo(req, res) {
    const userData = req.body;
    try {
      const data = await UserService.updateCompanyUserInfo(userData);
      return res.status(201).json({
        data,
      });
    } catch (error) {
      res.status(500).json({ error: { message: error.message } });
    }
  }

  static async removeCompanyUser(req, res) {
    try {
      const userId = req.userId;
      const companyUserId = req.query.companyUserId;
      const rootUser = await db.User.findByPk(userId);

      if (rootUser.role !== "Super-Admin")
        throw new Error("access denied, only root user can remove account");

      const data = await db.User.destroy({ where: { id: companyUserId } });
      return res.status(201).json({ data, message: "remove successfully" });
    } catch (error) {
      res.status(500).json({ error: { message: error.message } });
    }
  }

  static async getPaginatedUsers(req, res) {
    const { page, limit } = req.query;
    try {
      const users = await UserService.getUsers({
        page,
        limit,
        userId: req.userId,
      });
      return res.status(200).json({ data: users });
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  static async getUserByEmailOrId(req, res) {
    const { email, id } = req.query;

    try {
      const user = await UserService.getUserByEmailOrId({ email, id });
      return res.status(200).json({ data: user });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  static async loginUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, googleIdToken } = req.body;

    try {
      let user;
      if (googleIdToken) {
        // Google login flow
        const ticket = await client.verifyIdToken({
          idToken: googleIdToken,
          audience: process.env.GOOGLE_AUTH_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (payload.email !== email) {
          return res
            .status(400)
            .json({ error: "Email mismatch with Google token" });
        }

        // Find user by email or Google ID
        user = await UserService.findOne({ where: { email } });
        if (!user) {
          return res
            .status(401)
            .json({ error: "User not found. Please sign up first." });
        }

        // Optionally check googleId if stored
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(401).json({ error: "Google ID mismatch" });
        }
      } else {
        // Regular email/password login flow
        if (!email || !password) {
          return res
            .status(400)
            .json({ error: "Email and password are required" });
        }

        user = await UserService.findOne({ where: { email } });

        if (!user) {
          return res
            .status(401)
            .json({ success: false, message: "Incorrect email or password." });
        }

        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) {
          return res
            .status(401)
            .json({ error: "Incorrect email or password." });
        }
      }

      // Generate JWT for both flows
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
      return res.status(200).json({
        message: "User logged in successfully.",
        data: {
          user,
          token,
          expiresAt: decoded.exp,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(401).json({ message: error.message });
    }
  }

  static async changePassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
      await UserService.changeUserPassword({
        id: userId,
        currentPassword,
        newPassword,
      });
      return res
        .status(200)
        .json({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(400).json({ message: error.message });
    }
  }

  static async deleteUser(req, res) {
    const { id } = req.params;

    try {
      await UserService.deleteUser(id);
      return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(400).json({ message: error.message });
    }
  }

  static async checkEmail(req, res) {
    try {
      const user = await UserService.getUser({
        where: {
          email: req.body.email,
        },
        attributes: ["id", "email"],
      });
      res.status(200).send({
        code: 200,
        message: "User email check",
        userExists: user ? true : false,
      });
    } catch (error) {
      console.error("error", error);
      return res.status(500).send(error);
    }
  }

  static async getUserDetailsById(req, res) {
    const userId = req.query.userId;
    if (!userId)
      return res
        .status(401)
        .json({ error: { message: "Unauthorized: No user ID found" } });
    const userInfo = await UserService.getUserInfo(userId);
    if (!userInfo)
      return res.status(401).json({ error: { message: "User not found" } });
    return res.status(200).json({ data: userInfo });
  }

  static async userInfo(req, res) {
    try {
      // Get the authenticated user's ID from the request (set by auth middleware)
      const userId = req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user ID found" });
      }

      // Fetch user information using the UserService
      const userInfo = await UserService.getUserInfo(userId);

      // Return the user info in the response
      return res.status(200).json(userInfo);
    } catch (error) {
      console.error("Error fetching user info:", error);
      if (error.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = UserController;
