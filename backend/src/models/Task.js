import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxLength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },

    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
      required: true,
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ creator: 1, createdAt: -1 });
taskSchema.index({ assignedUser: 1, createdAt: -1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;