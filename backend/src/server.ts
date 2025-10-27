import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import morgan from "morgan";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import adminRoutes from "./routes/admin";
import headRoutes from "./routes/head";
import profileRoutes from "./routes/profile";
import evaluationRoutes from "./routes/evaluations";
import classScheduleRoutes from "./routes/classSchedules";
import classesRoutes from "./routes/classes";
import examScheduleRoutes from "./routes/examSchedules";
import roomRoutes from "./routes/rooms";
import announcementRoutes from "./routes/announcements";
import { errorHandler } from "./middleware/errorHandler";
import { env } from "./config/env";
import { seedSuperAdmin } from "./utils/seedSuperAdmin";

const app = express();
const PORT = env.port;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    // In development allow the request origin (reflect) so local tooling/ports don't block.
    // In production, restrict to the configured frontend URL.
    origin: env.nodeEnv === "development" ? true : env.frontendUrl,
    credentials: true,
  })
);

// Serve uploaded static files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "..", "uploads"))
);
// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Pathways UI Backend is running",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/head", headRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/schedules/class", classScheduleRoutes);
app.use("/api/schedules/exam", examScheduleRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/classes", classesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Error handling middleware
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await seedSuperAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

void startServer();

export default app;
