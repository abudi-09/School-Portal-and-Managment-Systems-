import mongoose from "mongoose";
import connectDB from "../../config/database";
import User from "../../models/User";

async function main() {
  try {
    await connectDB();
    const teachers = await User.find({
      role: "teacher",
      isActive: true,
      "academicInfo.grade": { $in: ["11", "12"] },
      $or: [
        { "academicInfo.stream": { $exists: false } },
        { "academicInfo.stream": null },
        { "academicInfo.stream": "" },
      ],
    })
      .select(
        "firstName lastName email academicInfo.grade academicInfo.subjects academicInfo.stream"
      )
      .lean();

    if (!teachers.length) {
      console.log("All senior-grade teachers have a stream set. ✅");
      process.exit(0);
    }

    console.log("Teachers missing academicInfo.stream (grade 11/12):");
    for (const t of teachers as any[]) {
      const name = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
      console.log(
        `- ${name || t.email} | email: ${t.email} | grade: ${
          t.academicInfo?.grade
        } | subjects: ${(t.academicInfo?.subjects || []).join(", ")}`
      );
    }
    process.exit(0);
  } catch (err) {
    console.error("Failed to list teachers missing stream:", err);
    process.exit(1);
  } finally {
    // Close any open connections cleanly
    try {
      await mongoose.connection.close();
    } catch {
      // ignore
    }
  }
}

void main();
