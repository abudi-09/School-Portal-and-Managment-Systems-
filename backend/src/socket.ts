import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config/env";
import User, { IUser } from "./models/User";

interface SocketUser {
  id: string;
  role: IUser["role"];
}

type AuthenticatedSocket = Socket & { user?: SocketUser };

let ioInstance: Server | null = null;

const roomForUser = (userId: string) => `user:${userId}`;

export const initSocket = (server: http.Server): Server => {
  ioInstance = new Server(server, {
    cors: {
      origin: env.nodeEnv === "development" ? true : env.frontendUrl,
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const authToken =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization as string | undefined);

      if (!authToken) {
        return next(new Error("Authentication token missing"));
      }

      const token = authToken.startsWith("Bearer ")
        ? authToken.substring(7)
        : authToken;

      const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
      const user = await User.findById(decoded.userId)
        .select("role isActive status")
        .lean();

      if (!user || !user.isActive || user.status !== "approved") {
        return next(new Error("Unauthorized"));
      }

      (socket as AuthenticatedSocket).user = {
        id: decoded.userId,
        role: user.role,
      };
      return next();
    } catch (error) {
      return next(new Error("Invalid authentication token"));
    }
  });

  ioInstance.on("connection", (socket: AuthenticatedSocket) => {
    const socketUser = socket.user;
    if (!socketUser) {
      socket.disconnect(true);
      return;
    }

    socket.join(roomForUser(socketUser.id));

    socket.on("disconnect", () => {
      socket.leave(roomForUser(socketUser.id));
    });
  });

  return ioInstance;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.IO server not initialized");
  }
  return ioInstance;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (!ioInstance) {
    return;
  }
  ioInstance.to(roomForUser(userId)).emit(event, payload);
};

export const getUserRoom = (userId: string) => roomForUser(userId);
