
import express from "express";
import mongoose from "mongoose";
import Organization from "../models/organization.js";
import User from "../models/user.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new organization
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Organization name is required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.organization) {
      return res.status(409).json({
        message: "You already belong to an organization",
      });
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return res.status(400).json({
        message: "Please provide a valid organization name",
      });
    }

    const organization = await Organization.create({
      name: name.trim(),
      slug,
      createdBy: user._id,
    });

    user.organization = organization._id;
    user.role = "Admin";
    await user.save();

    return res.status(201).json({
      message: "Organization created successfully",
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        createdBy: organization.createdBy,
      },
      user: {
        id: user._id,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An organization with this URL slug already exists",
      });
    }

    console.error("Create organization error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Get the logged-in user's organization
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.organization) {
      return res.status(404).json({
        message: "You do not belong to an organization yet",
      });
    }

    const organization = await Organization.findById(
      user.organization
    );

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        createdBy: organization.createdBy,
        createdAt: organization.createdAt,
      },
      userRole: user.role,
    });
  } catch (error) {
    console.error("Get organization error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Add an existing user to the organization
router.post("/members", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const admin = await User.findById(req.user.userId);

    if (!admin) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!admin.organization || admin.role !== "Admin") {
      return res.status(403).json({
        message: "Only an organization Admin can add members",
      });
    }

    const member = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!member) {
      return res.status(404).json({
        message: "Registered user not found. Ask them to register first.",
      });
    }

    if (member._id.toString() === admin._id.toString()) {
      return res.status(400).json({
        message: "You are already an Admin of this organization",
      });
    }

    if (member.organization) {
      return res.status(409).json({
        message: "This user already belongs to an organization",
      });
    }

    member.organization = admin.organization;
    member.role = "Contributor";
    await member.save();

    return res.status(200).json({
      message: "Member added successfully",
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        organization: member.organization,
      },
    });
  } catch (error) {
    console.error("Add organization member error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Get all members of the logged-in user's organization
router.get("/members", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.organization) {
      return res.status(404).json({
        message: "You do not belong to an organization",
      });
    }

    const members = await User.find({
      organization: user.organization,
    }).select("name email role createdAt");

    return res.status(200).json({
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Get organization members error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Update a team member's role
router.patch(
  "/members/:memberId/role",
  authMiddleware,
  async (req, res) => {
    try {
      const { memberId } = req.params;
      const { role } = req.body;

      if (!mongoose.isValidObjectId(memberId)) {
        return res.status(400).json({
          message: "Invalid member ID",
        });
      }

      if (!["Manager", "Contributor"].includes(role)) {
        return res.status(400).json({
          message: "Role must be Manager or Contributor",
        });
      }

      const admin = await User.findById(req.user.userId);

      if (!admin || !admin.organization || admin.role !== "Admin") {
        return res.status(403).json({
          message: "Only an organization Admin can change member roles",
        });
      }

      if (admin._id.toString() === memberId) {
        return res.status(400).json({
          message: "You cannot change your own role",
        });
      }

      const member = await User.findOne({
        _id: memberId,
        organization: admin.organization,
      });

      if (!member) {
        return res.status(404).json({
          message: "Team member not found in your organization",
        });
      }

      member.role = role;
      await member.save();

      return res.status(200).json({
        message: "Member role updated successfully",
        member: {
          id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
        },
      });
    } catch (error) {
      console.error("Update member role error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

// Remove a team member from the organization
router.delete(
  "/members/:memberId",
  authMiddleware,
  async (req, res) => {
    try {
      const { memberId } = req.params;

      if (!mongoose.isValidObjectId(memberId)) {
        return res.status(400).json({
          message: "Invalid member ID",
        });
      }

      const admin = await User.findById(req.user.userId);

      if (!admin || !admin.organization || admin.role !== "Admin") {
        return res.status(403).json({
          message: "Only an organization Admin can remove members",
        });
      }

      if (admin._id.toString() === memberId) {
        return res.status(400).json({
          message: "You cannot remove yourself from the organization",
        });
      }

      const member = await User.findOne({
        _id: memberId,
        organization: admin.organization,
      });

      if (!member) {
        return res.status(404).json({
          message: "Team member not found in your organization",
        });
      }

      member.organization = null;
      member.role = "Contributor";
      await member.save();

      return res.status(200).json({
        message: "Member removed from organization successfully",
      });
    } catch (error) {
      console.error("Remove organization member error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

export default router;

