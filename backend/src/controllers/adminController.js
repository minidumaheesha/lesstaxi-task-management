import User from "../models/User.js";
import Task from "../models/Task.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("name email role createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: users.length,
        users: users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { assignedUser } = req.body ?? {};
    const isObjectId = (value) =>
      typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

    if (!isObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    if (assignedUser !== null && !isObjectId(assignedUser)) {
      return res.status(400).json({
        success: false,
        message: "assignedUser must be a valid user ID or null",
      });
    }

    if (assignedUser !== null) {
      const userExists = await User.exists({ _id: assignedUser });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Selected user does not exist",
        });
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { assignedUser } },
      {
        returnDocument: "after",
        runValidators: true,
      }
    )
      .populate("creator", "name email")
      .populate("assignedUser", "name email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        assignedUser === null
          ? "Task unassigned successfully"
          : "Task assigned successfully",
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};