const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function updatePassword() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/pathways"
    );

    const User = mongoose.model(
      "User",
      new mongoose.Schema({
        email: String,
        password: String,
      })
    );

    const hashedPassword = await bcrypt.hash("Admin@12345", 10);

    console.log("Generated hash for Admin@12345:", hashedPassword);

    const result = await User.updateOne(
      { email: "superadmin@pathways.local" },
      { $set: { password: hashedPassword } }
    );

    console.log("Update result:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updatePassword();
