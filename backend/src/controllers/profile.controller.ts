import type { Request, Response } from "express";
import { validationResult, matchedData } from "express-validator";
import profileService from "../services/profile.service";

const handleValidation = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array();
    const error = new Error("Validation failed");
    (error as any).statusCode = 400;
    (error as any).details = formatted;
    throw error;
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const user = await profileService.getProfile(req.user._id.toString());

    return res.json({ success: true, data: { user } });
  } catch (error: any) {
    const status = error?.statusCode ?? 500;
    if (status >= 500) {
      console.error("profileController.getProfile", error);
    }
    return res.status(status).json({
      success: false,
      message: error?.message ?? "Failed to retrieve profile",
      errors: error?.details,
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    handleValidation(req);
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const payload = matchedData(req, {
      locations: ["body"],
      includeOptionals: true,
    }) as {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      address?: string;
    };

    const legacyProfile = (req.body as any)?.profile;
    if (
      payload.phoneNumber === undefined &&
      legacyProfile?.phone !== undefined
    ) {
      payload.phoneNumber = legacyProfile.phone;
    }
    if (payload.address === undefined && legacyProfile?.address !== undefined) {
      payload.address = legacyProfile.address;
    }

    const user = await profileService.updateProfile(
      req.user._id.toString(),
      payload
    );

    return res.json({
      success: true,
      message: "Profile updated",
      data: { user },
    });
  } catch (error: any) {
    const status = error?.statusCode ?? 500;
    if (status >= 500) {
      console.error("profileController.updateProfile", error);
    }
    return res.status(status).json({
      success: false,
      message: error?.message ?? "Failed to update profile",
      errors: error?.details,
    });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    if (!req.file?.path) {
      return res
        .status(400)
        .json({ success: false, message: "Avatar file is required" });
    }

    const user = await profileService.updateAvatar(
      req.user._id.toString(),
      req.file.path
    );

    return res.json({
      success: true,
      message: "Avatar updated",
      data: { user },
    });
  } catch (error: any) {
    const status = error?.statusCode ?? 500;
    if (status >= 500) {
      console.error("profileController.updateAvatar", error);
    }
    return res.status(status).json({
      success: false,
      message: error?.message ?? "Failed to update avatar",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    handleValidation(req);
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { currentPassword, newPassword } = matchedData(req, {
      locations: ["body"],
    }) as { currentPassword: string; newPassword: string };

    await profileService.changePassword(
      req.user._id.toString(),
      currentPassword,
      newPassword
    );

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    const status = error?.statusCode ?? 500;
    if (status >= 500) {
      console.error("profileController.changePassword", error);
    }
    return res.status(status).json({
      success: false,
      message: error?.message ?? "Failed to change password",
      errors: error?.details,
    });
  }
};

export default {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
};
