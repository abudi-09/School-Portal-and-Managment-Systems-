import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value !== undefined) {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${key}`);
};

export const env = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  port: Number(getEnv("PORT", "5000")),
  frontendUrl: getEnv("FRONTEND_URL", "http://localhost:5173"),
  mongoUri: getEnv("MONGODB_URI", "mongodb://localhost:27017/pathways_db"),
  jwtSecret: getEnv("JWT_SECRET", "change-me"),
  jwtExpiresIn: getEnv("JWT_EXPIRES_IN", "7d"),
  superAdmin: {
    email: getEnv("SUPER_ADMIN_EMAIL", "superadmin@pathways.local"),
    password: getEnv("SUPER_ADMIN_PASSWORD", "ChangeMe123!"),
    firstName: getEnv("SUPER_ADMIN_FIRST_NAME", "Super"),
    lastName: getEnv("SUPER_ADMIN_LAST_NAME", "Admin"),
  },
};
