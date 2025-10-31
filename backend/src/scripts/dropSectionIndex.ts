import mongoose from "mongoose";
import { env } from "../config/env";

async function run() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database handle unavailable");
    const collectionName = "sections";
    const coll = db.collection(collectionName);

    const indexes = await coll.indexes();
    console.log(
      "Existing indexes:",
      indexes.map((i) => i.name)
    );

    // Look for an index that only includes grade and normalizedLabel
    const target = indexes.find((ix: any) => {
      const k = ix.key || {};
      const keys = Object.keys(k).sort().join(",");
      return (
        keys === "grade,normalizedLabel" || keys === "normalizedLabel,grade"
      );
    });

    if (!target) {
      console.log(
        "No legacy grade+normalizedLabel index found. Nothing to drop."
      );
    } else {
      const idxName = target.name as string | undefined;
      console.log(`Found legacy index: ${idxName}. Dropping...`);
      if (idxName) {
        await coll.dropIndex(idxName);
        console.log("Dropped index", idxName);
      } else {
        console.warn("Index has no name; skipping drop");
      }
    }

    // Show final indexes
    const final = await coll.indexes();
    console.log(
      "Final indexes:",
      final.map((i) => i.name)
    );

    await mongoose.disconnect();
    console.log("Disconnected");
  } catch (err) {
    console.error("Failed to drop index:", err);
    process.exitCode = 2;
  }
}

void run();
