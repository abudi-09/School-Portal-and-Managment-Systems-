import { Types } from "mongoose";
import { IMessage, MessageRole, MessageStatus } from "../models/Message";

export type ObjectIdLike = Types.ObjectId | string;
export type DateLike = Date | string | null | undefined;

export interface MessageLike {
  _id: ObjectIdLike;
  sender: ObjectIdLike;
  receiver: ObjectIdLike;
  content: string;
  status: MessageStatus;
  senderRole: MessageRole;
  receiverRole: MessageRole;
  threadKey: string;
  createdAt: Date | string;
  readAt?: DateLike;
}

export interface NormalizedMessage {
  id: string;
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  status: MessageStatus;
  timestamp: string;
  readAt?: string;
  senderRole: MessageRole;
  receiverRole: MessageRole;
  threadKey: string;
}

const toStringId = (value: ObjectIdLike): string =>
  typeof value === "string" ? value : value.toString();

const toIsoString = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

const toOptionalIsoString = (value: DateLike): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

export const normalizeMessage = (
  message: MessageLike | IMessage
): NormalizedMessage => {
  const normalized: NormalizedMessage = {
    id: toStringId(message._id as ObjectIdLike),
    _id: toStringId(message._id as ObjectIdLike),
    senderId: toStringId(message.sender as ObjectIdLike),
    receiverId: toStringId(message.receiver as ObjectIdLike),
    content: message.content,
    status: message.status,
    timestamp: toIsoString(message.createdAt as Date | string),
    senderRole: message.senderRole,
    receiverRole: message.receiverRole,
    threadKey: message.threadKey,
  };

  const readAt = toOptionalIsoString(message.readAt as DateLike);
  if (readAt) {
    normalized.readAt = readAt;
  }

  return normalized;
};

export const normalizeMessageIds = (
  messages: Array<MessageLike | IMessage>
): NormalizedMessage[] => messages.map((message) => normalizeMessage(message));
