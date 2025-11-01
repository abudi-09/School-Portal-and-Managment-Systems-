import mongoose from "mongoose";
import connectDB from "../../config/database";
import User from "../../models/User";

/**
 * Small utility to set academicInfo.stream for specific teachers by email.
 * Usage: edit the EMAIL_TO_STREAM map below, then run via ts-node.
 * Only applies to teachers with academicInfo.grade of "11" or "12".
 */

const EMAIL_TO_STREAM: Record<string, "natural" | "social"> = {
  // "teacher1@example.com": "natural",
  // "teacher2@example.com": "social",
};

async function main() {
  try {
    await connectDB();
    const emails = Object.keys(EMAIL_TO_STREAM);
    if (!emails.length) {
      console.log("No mappings provided. Edit EMAIL_TO_STREAM and try again.");
      process.exit(0);
    }

    let updated = 0;
    for (const email of emails) {
      const stream = EMAIL_TO_STREAM[email];
      const doc = await User.findOne({
        email: email.toLowerCase(),
        role: "teacher",
        "academicInfo.grade": { $in: ["11", "12"] },
      });
      if (!doc) {
        console.warn(`Skip: no senior teacher found for ${email}`);
        continue;
      }
      doc.academicInfo = doc.academicInfo || {};
      (doc.academicInfo as any).stream = stream;
      await doc.save();
      console.log(`Set stream=${stream} for ${email}`);
      updated++;
    }

    console.log(`Done. Updated ${updated} teacher(s).`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to set teacher stream:", err);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
    } catch {}
  }
}

void main();
