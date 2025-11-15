import User from "../models/User";
import { env } from "../config/env";

const logPrefix = "👑 Super Admin Seed";

export const seedSuperAdmin = async (): Promise<void> => {
  const { email, password, firstName, lastName } = env.superAdmin;

  if (!email || !password) {
    console.warn(
      `${logPrefix}: Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD. Skipping seed.`
    );
    return;
  }

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    await User.create({
      email,
      password,
      firstName,
      lastName,
      role: "admin",
      status: "approved",
      isActive: true,
    });

    return;
  }

  let requiresUpdate = false;

  if (existingUser.role !== "admin") {
    existingUser.role = "admin";
    requiresUpdate = true;
  }

  if (existingUser.status !== "approved") {
    existingUser.status = "approved";
    requiresUpdate = true;
  }

  if (!existingUser.isActive) {
    existingUser.isActive = true;
    requiresUpdate = true;
  }

  const needsNameUpdate =
    (!existingUser.firstName && firstName) ||
    (!existingUser.lastName && lastName);

  if (needsNameUpdate) {
    existingUser.firstName = existingUser.firstName || firstName;
    existingUser.lastName = existingUser.lastName || lastName;
    requiresUpdate = true;
  }

  if (requiresUpdate) {
    await existingUser.save();
    return;
  }
};
