import mongoose from "mongoose";
import { env } from "./env";

// Connection tuning and retry behavior
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1s

const connectWithRetry = async (retries = 0): Promise<void> => {
  try {
    // Explicit connection options to make failures more deterministic
    const options = {
      // Increase timeouts to better tolerate slow networks/TLS inspection
      serverSelectionTimeoutMS: 30000, // was 10000
      socketTimeoutMS: 60000, // was 45000
      connectTimeoutMS: 20000, // was 10000
      // useNewUrlParser and useUnifiedTopology are defaults in modern mongoose,
      // but leaving comment here to remind why we rely on the driver defaults.
    } as mongoose.ConnectOptions;

    const conn = await mongoose.connect(env.mongoUri, options);

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("📡 MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("📡 MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB (attempt ${retries + 1}):`, error);

    if (retries < MAX_RETRIES - 1) {
      const jitter = Math.floor(Math.random() * 250); // 0-250ms jitter
      const delay = BASE_DELAY_MS * Math.pow(2, retries) + jitter; // exponential backoff + jitter
      console.log(`🔁 Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return connectWithRetry(retries + 1);
    }

    console.error("🚨 Could not connect to MongoDB after multiple attempts.");
    // Don't exit the process immediately here to allow outer code to decide behavior.
    // Throw the error so callers (like startServer) can handle shutdown logic.
    throw error;
  }
};

const connectDB = async (): Promise<void> => {
  await connectWithRetry();
};

export default connectDB;
