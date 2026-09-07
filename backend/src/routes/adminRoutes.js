import express from "express";
import {
  assignTask,
  getAllUsers,
} from "../controllers/adminController.js";
import {
  authorizeRoles,
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/users", getAllUsers);
router.patch("/tasks/:id/assign", assignTask);

export default router;