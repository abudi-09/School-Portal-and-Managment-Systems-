import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.mongoUri);
    console.log("🍃 Connected to MongoDB");

    // Check if Super Admin already exists
    const existingAdmin = await mongoose.connection
      .db!.collection("users")
      .findOne({
        email: env.superAdmin.email,
      });

    if (existingAdmin) {
      console.log("👑 Super Admin already exists. Skipping creation.");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(env.superAdmin.password, 12);

    // Create Super Admin document
    const superAdmin = {
      email: env.superAdmin.email,
      password: hashedPassword,
      firstName: env.superAdmin.firstName,
      lastName: env.superAdmin.lastName,
      role: "admin",
      status: "approved",
      isActive: true,
      profile: {},
      academicInfo: {},
      employmentInfo: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into users collection
    const result = await mongoose.connection
      .db!.collection("users")
      .insertOne(superAdmin);

    console.log("👑 Super Admin created successfully!");
    console.log(`📧 Email: ${env.superAdmin.email}`);
    console.log(`🔑 Password: ${env.superAdmin.password}`);
    console.log(`🆔 ID: ${result.insertedId}`);
  } catch (error) {
    console.error("❌ Error creating Super Admin:", error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("📡 Database connection closed");
  }
};

// Run the script
createSuperAdmin();
