import http from "http";
import app from "./app";
import connectDB from "./config/database";
import { env } from "./config/env";
import { seedSuperAdmin } from "./utils/seedSuperAdmin";
import { initSocket } from "./socket";

const PORT = env.port;
const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();
    await seedSuperAdmin();
    initSocket(server);

    server.listen(PORT, () => {
      if (env.nodeEnv === "development") {
        console.log(`🚀 Server running on port ${PORT}`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

void startServer();
