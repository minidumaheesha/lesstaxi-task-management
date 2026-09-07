import express from "express";
import { body } from "express-validator";
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must contain between 2 and 50 characters"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address"),

    body("password")
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
      })
      .withMessage(
        "Password must contain at least 8 characters, including uppercase, lowercase, and a number"
      ),
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address"),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  loginUser
);

router.get("/me", protect, getCurrentUser);

export default router;