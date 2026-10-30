import express from "express";
import Comment from "../models/comment.js";
import Task from "../models/task.js";
import User from "../models/user.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Add a comment to a task
router.post("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const { taskId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user || !user.organization) {
      return res.status(403).json({
        message: "User or organization not found",
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      organization: user.organization,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const comment = await Comment.create({
      task: task._id,
      organization: user.organization,
      author: user._id,
      text: text.trim(),
    });

    return res.status(201).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
// Get all comments for a task
router.get("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user || !user.organization) {
      return res.status(403).json({
        message: "User or organization not found",
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      organization: user.organization,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const comments = await Comment.find({
      task: task._id,
      organization: user.organization,
    })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
export default router;