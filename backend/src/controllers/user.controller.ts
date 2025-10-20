import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../models/User";

const ALLOWED_UPGRADE_ROLES = ["student", "teacher", "head"] as const;

type AllowedUpgradeRole = (typeof ALLOWED_UPGRADE_ROLES)[number];

export const getApprovedUsers = async (_req: Request, res: Response) => {
  try {
    const approvedUsers = await User.find({
      status: "approved",
      role: { $in: ALLOWED_UPGRADE_ROLES },
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      message: "Approved users retrieved successfully",
      data: {
        users: approvedUsers,
      },
    });
  } catch (error: unknown) {
    console.error("Fetch approved users error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving users",
    });
  }
};

export const upgradeUserRole = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      errors: errors.array(),
    });
  }

  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isAllowedRole = ALLOWED_UPGRADE_ROLES.includes(
      user.role as AllowedUpgradeRole
    );

    if (!isAllowedRole) {
      return res.status(400).json({
        success: false,
        message: "Only students, teachers, or heads can be upgraded to admin",
      });
    }

    if (user.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "User must be approved before upgrade",
      });
    }

    if (user.role === "admin") {
      return res.status(409).json({
        success: false,
        message: "User is already an admin",
      });
    }

    user.role = "admin";
    user.status = "approved";
    user.isActive = true;

    await user.save();

    const { password: _removedPassword, ...upgradedUser } = user.toObject();

    return res.json({
      success: true,
      message: "User upgraded to admin successfully",
      data: {
        user: upgradedUser,
      },
    });
  } catch (error: unknown) {
    console.error("Upgrade user role error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error upgrading user",
    });
  }
};
