import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

const { cloudName, apiKey, apiSecret, avatarFolder } = env.cloudinary;

export const isCloudinaryConfigured = Boolean(
  cloudName &&
    cloudName !== "" &&
    apiKey &&
    apiKey !== "" &&
    apiSecret &&
    apiSecret !== ""
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn(
    "Cloudinary credentials are missing or incomplete; avatar uploads will be disabled until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are configured."
  );
}

export const avatarUploadFolder = avatarFolder;

export default cloudinary;
