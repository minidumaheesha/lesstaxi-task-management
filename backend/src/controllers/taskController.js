import { validationResult } from "express-validator";
import Task from "../models/Task.js";

export const createTask = async (req, res, next) => {
  try {
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

    const { title, description } = req.body;

    const task = await Task.create({
      title,
      description,
      creator: req.user._id,
      status: "todo",
      assignedUser: null,
    });

    await task.populate([
      { path: "creator", select: "name email" },
      { path: "assignedUser", select: "name email" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const claimTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        assignedUser: null,
      },
      {
        $set: { assignedUser: req.user._id },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    )
      .populate("creator", "name email")
      .populate("assignedUser", "name email");

    if (!task) {
      return res.status(409).json({
        success: false,
        message: "Task is unavailable or has already been assigned",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task claimed successfully",
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role !== "admin") {
      filter.$or = [
        { assignedUser: req.user._id },
        {
          creator: req.user._id,
          assignedUser: null,
        },
      ];
    }

    const task = await Task.findOneAndUpdate(
      filter,
      {
        $set: { status: req.body.status },
      },
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
        message: "Task not found or not available for you to update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : {
            $or: [
              { creator: req.user._id },
              { assignedUser: req.user._id },
              { assignedUser: null },
            ],
          };

    const tasks = await Task.find(filter)
      .populate("creator", "name email")
      .populate("assignedUser", "name email")
      .sort({ createdAt: -1, _id: -1 });

    return res.status(200).json({
      success: true,
      data: {
        totalTasks: tasks.length,
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getManageableTaskFilter = (user, taskId) => {
  const filter = { _id: taskId };

  if (user.role !== "admin") {
    filter.$or = [
      { assignedUser: user._id },
      { creator: user._id, assignedUser: null },
    ];
  }

  return filter;
};

export const updateTask = async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.title !== undefined) {
      updates.title = req.body.title;
    }

    if (req.body.description !== undefined) {
      updates.description = req.body.description;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide a title or description to update",
      });
    }

    const task = await Task.findOneAndUpdate(
      getManageableTaskFilter(req.user, req.params.id),
      { $set: updates },
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
        message: "Task not found or not available for you to update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete(
      getManageableTaskFilter(req.user, req.params.id)
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not available for you to delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: { id: task._id },
    });
  } catch (error) {
    next(error);
  }
};