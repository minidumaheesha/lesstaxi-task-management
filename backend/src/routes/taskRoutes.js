import express from "express";
import { body, param, validationResult } from "express-validator";
import {
  claimTask,
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

router.use(protect);

router.get("/", getTasks);

router.post(
  "/",
  [
    body("title")
      .isString()
      .withMessage("Title must be text")
      .bail()
      .trim()
      .isLength({ min: 1, max: 120 })
      .withMessage("Title must contain between 1 and 120 characters"),

    body("description")
      .isString()
      .withMessage("Description must be text")
      .bail()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage(
        "Description must contain between 1 and 2000 characters"
      ),
  ],
  validateRequest,
  createTask
);

router.patch(
  "/:id/claim",
  param("id").isMongoId().withMessage("Invalid task ID"),
  validateRequest,
  claimTask
);

router.patch(
  "/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),

    body("status")
      .isString()
      .withMessage("Status must be text")
      .bail()
      .isIn(["todo", "doing", "done"])
      .withMessage("Status must be todo, doing, or done"),
  ],
  validateRequest,
  updateTaskStatus
);

router.patch(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),

    body("title")
      .optional()
      .isString()
      .withMessage("Title must be text")
      .bail()
      .trim()
      .isLength({ min: 1, max: 120 })
      .withMessage("Title must contain between 1 and 120 characters"),

    body("description")
      .optional()
      .isString()
      .withMessage("Description must be text")
      .bail()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage(
        "Description must contain between 1 and 2000 characters"
      ),
  ],
  validateRequest,
  updateTask
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid task ID"),
  validateRequest,
  deleteTask
);

export default router;