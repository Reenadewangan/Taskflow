import express from "express";
import Project from "../models/project.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { attachUser, requireOrg, requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All project routes need: valid JWT + full user + organization membership
router.use(authMiddleware, attachUser, requireOrg);

// POST /api/projects — Create a project (Admin & Manager only)
router.post("/", requireRole("Admin", "Manager"), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      organization: req.user.organization,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// GET /api/projects — List all projects in user's organization
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({
      organization: req.user.organization,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("List projects error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// GET /api/projects/:id — Get a single project by ID
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Ensure the project belongs to the user's organization
    if (project.organization.toString() !== req.user.organization.toString()) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({ project });
  } catch (error) {
    console.error("Get project error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// PUT /api/projects/:id — Update a project (Admin & Manager only)
router.put("/:id", requireRole("Admin", "Manager"), async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Ensure the project belongs to the user's organization
    if (project.organization.toString() !== req.user.organization.toString()) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Update only provided fields
    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();

    await project.save();

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// DELETE /api/projects/:id — Delete a project (Admin only)
router.delete("/:id", requireRole("Admin"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Ensure the project belongs to the user's organization
    if (project.organization.toString() !== req.user.organization.toString()) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
