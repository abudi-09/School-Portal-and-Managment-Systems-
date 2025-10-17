import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import morgan from "morgan";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
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
    origin: env.frontendUrl,
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
      console.log(`📱 Frontend URL: ${env.frontendUrl}`);
      console.log(`🌍 Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

void startServer();

export default app;
