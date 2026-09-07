import express from "express";
import { body } from "express-validator";
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  loginLimiter,
  registrationLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

const emailValidation = () =>
  body("email")
    .isString()
    .withMessage("Email must be text")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address");

const passwordValidation = () =>
  body("password")
    .isString()
    .withMessage("Password must be text")
    .bail()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage(
      "Password must not exceed 72 bytes. Some characters use more than one byte."
    )
    .bail();

router.post(
  "/register",
  registrationLimiter,
  [
    body("name")
      .isString()
      .withMessage("Name must be text")
      .bail()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must contain between 2 and 50 characters"),

    emailValidation(),

    passwordValidation()
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
  loginLimiter,
  [emailValidation(), passwordValidation()],
  loginUser
);

router.get("/me", protect, getCurrentUser);

export default router;