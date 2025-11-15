import mongoose, { Types } from "mongoose";
import User, { IUser } from "../models/User";
import { MessageRole } from "../models/Message";

export const formatUserName = (
  user: Pick<IUser, "firstName" | "lastName" | "email">
): string => {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`
    .trim()
    .replace(/\s+/g, " ");
  return fullName || user.email || "User";
};

export const hierarchyAllows = (
  senderRole: MessageRole,
  receiverRole: MessageRole
) => {
  if (senderRole === "admin") {
    return receiverRole === "head";
  }
  if (senderRole === "head") {
    return receiverRole === "admin" || receiverRole === "teacher";
  }
  if (senderRole === "teacher") {
    return receiverRole === "head";
  }
  return false;
};

export const ensureUsersExist = async (
  senderId: Types.ObjectId,
  receiverId: Types.ObjectId
): Promise<{ sender: IUser; receiver: IUser }> => {
  const users = await User.find({ _id: { $in: [senderId, receiverId] } })
    .select(
      "firstName lastName email role status isActive lastSeenAt privacy.hideOnlineStatus"
    )
    .lean();

  const sender = users.find((item) => item._id?.equals(senderId));
  const receiver = users.find((item) => item._id?.equals(receiverId));

  if (!sender || !receiver) {
    throw new Error("Sender or receiver not found");
  }

  if (!sender.isActive || sender.status !== "approved") {
    throw new Error("Sender is not active");
  }

  if (!receiver.isActive || receiver.status !== "approved") {
    throw new Error("Receiver is not active");
  }

  return {
    sender: sender as unknown as IUser,
    receiver: receiver as unknown as IUser,
  };
};

export const asObjectId = (value: string | Types.ObjectId): Types.ObjectId =>
  typeof value === "string" ? new mongoose.Types.ObjectId(value) : value;
