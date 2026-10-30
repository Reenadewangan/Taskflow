
import express from "express";
import Task from "../models/task.js";
import Project from "../models/project.js";
import User from "../models/user.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate } =
      req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "A valid project ID is required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.organization) {
      return res.status(403).json({
        message: "You must belong to an organization",
      });
    }

    if (!["Admin", "Manager"].includes(user.role)) {
      return res.status(403).json({
        message: "Only Admins and Managers can create tasks",
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      organization: user.organization,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found in your organization",
      });
    }

    let assigneeId = null;

    if (assignedTo) {
      if (!assignedTo.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          message: "Invalid assigned user ID",
        });
      }

      const assignee = await User.findOne({
        _id: assignedTo,
        organization: user.organization,
      });

      if (!assignee) {
        return res.status(400).json({
          message: "Assigned user must belong to your organization",
        });
      }

      assigneeId = assignee._id;
    }

    if (
      priority !== undefined &&
      !["Low", "Medium", "High"].includes(priority)
    ) {
      return res.status(400).json({
        message: "Priority must be Low, Medium, or High",
      });
    }

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      (typeof dueDate !== "string" ||
        Number.isNaN(Date.parse(dueDate)))
    ) {
      return res.status(400).json({
        message: "Please provide a valid due date",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
      project: project._id,
      organization: user.organization,
      createdBy: user._id,
      assignedTo: assigneeId,
      priority: priority || "Medium",
      dueDate: dueDate || null,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
// Get all tasks in the user's organization
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.organization) {
      return res.status(403).json({
        message: "You must belong to an organization",
      });
    }

    const filter = {
      organization: user.organization,
    };

    if (req.query.projectId) {
      if (!/^[0-9a-fA-F]{24}$/.test(req.query.projectId)) {
        return res.status(400).json({
          message: "Invalid project ID",
        });
      }

      filter.project = req.query.projectId;
    }

    if (req.query.status) {
      if (
        !["Todo", "In Progress", "In Review", "Done"].includes(
          req.query.status
        )
      ) {
        return res.status(400).json({
          message: "Invalid task status",
        });
      }

      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
// Update a task
router.patch("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate } =
      req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(req.params.taskId)) {
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
      _id: req.params.taskId,
      organization: user.organization,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Title cannot be empty",
        });
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          message: "Description must be a string",
        });
      }
      task.description = description.trim();
    }

    if (status !== undefined) {
      if (!["Todo", "In Progress", "In Review", "Done"].includes(status)) {
        return res.status(400).json({
          message: "Invalid task status",
        });
      }
      task.status = status;
    }

    if (priority !== undefined) {
      if (!["Low", "Medium", "High"].includes(priority)) {
        return res.status(400).json({
          message: "Invalid task priority",
        });
      }
      task.priority = priority;
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        task.assignedTo = null;
      } else {
        if (
          typeof assignedTo !== "string" ||
          !/^[0-9a-fA-F]{24}$/.test(assignedTo)
        ) {
          return res.status(400).json({
            message: "Invalid assigned user ID",
          });
        }

        const assignee = await User.findOne({
          _id: assignedTo,
          organization: user.organization,
        });

        if (!assignee) {
          return res.status(400).json({
            message: "Assigned user must belong to your organization",
          });
        }

        task.assignedTo = assignee._id;
      }
    }

    if (dueDate !== undefined) {
      if (
        dueDate !== null &&
        (typeof dueDate !== "string" || Number.isNaN(Date.parse(dueDate)))
      ) {
        return res.status(400).json({
          message: "Please provide a valid due date or null",
        });
      }
      task.dueDate = dueDate === null ? null : new Date(dueDate);
    }

    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("project", "name");
    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
export default router;
