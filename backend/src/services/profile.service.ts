import { unlink } from "node:fs/promises";
import User, { type IUser } from "../models/User";
import cloudinary, {
  avatarUploadFolder,
  isCloudinaryConfigured,
} from "../config/cloudinary";

const createServiceError = (statusCode: number, message: string) => {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  return error;
};

const sanitizeUser = (user: IUser) => user.toJSON();

const getProfile = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createServiceError(404, "User not found");
  }
  return sanitizeUser(user);
};

const updateProfile = async (
  userId: string,
  payload: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
  }
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createServiceError(404, "User not found");
  }

  if (payload.firstName !== undefined) {
    user.firstName = payload.firstName;
  }
  if (payload.lastName !== undefined) {
    user.lastName = payload.lastName;
  }
  if (payload.phoneNumber !== undefined) {
    user.phoneNumber = payload.phoneNumber;
  }
  if (payload.address !== undefined) {
    user.address = payload.address;
  }

  await user.save();
  return sanitizeUser(user);
};

const updateAvatar = async (userId: string, localPath: string) => {
  if (!isCloudinaryConfigured) {
    throw createServiceError(
      500,
      "Cloudinary credentials are not configured; avatar upload unavailable"
    );
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(localPath, {
      folder: avatarUploadFolder,
      public_id: `user_${userId}`,
      overwrite: true,
      transformation: [
        { width: 512, height: 512, crop: "thumb", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const user = await User.findById(userId);
    if (!user) {
      throw createServiceError(404, "User not found");
    }

    user.avatar = uploadResult.secure_url;
    await user.save();

    return sanitizeUser(user);
  } finally {
    await unlink(localPath).catch(() => undefined);
  }
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createServiceError(404, "User not found");
  }

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw createServiceError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();
};

export default {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
};
