import { Types } from "mongoose";
import {
  IMessage,
  MessageRole,
  MessageStatus,
  MessageType,
} from "../models/Message";

export type ObjectIdLike = Types.ObjectId | string;
export type DateLike = Date | string | null | undefined;

type MaybeObjectIdLike = ObjectIdLike | undefined | null;

export interface MessageLike {
  _id: ObjectIdLike;
  sender: ObjectIdLike;
  receiver: ObjectIdLike;
  content: string;
  status: MessageStatus;
  senderRole: MessageRole;
  receiverRole: MessageRole;
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
  deleted?: boolean;
  editedAt?: DateLike;
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  deletedAt?: DateLike;
  hiddenFor?: MaybeObjectIdLike[];
  replyToMessageId?: ObjectIdLike;
  forwardedFrom?: {
    originalMessageId?: ObjectIdLike;
    originalSenderId?: ObjectIdLike;
    originalSenderName?: string;
    originalSentAt?: DateLike;
  };
  deliveredTo?: MaybeObjectIdLike[];
  seenBy?: MaybeObjectIdLike[];
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
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  deleted: boolean;
  editedAt?: string;
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  deletedAt?: string;
  hiddenFor?: string[];
  replyToMessageId?: string;
  forwardedFrom?: {
    originalMessageId?: string;
    originalSenderId?: string;
    originalSenderName?: string;
    originalSentAt?: string;
  };
  deliveredTo: string[];
  seenBy: string[];
  threadKey: string;
}

const toStringId = (value: ObjectIdLike): string =>
  typeof value === "string" ? value : value.toString();

const normalizeIdentifiers = (values?: MaybeObjectIdLike[]): string[] =>
  (values ?? [])
    .map((value) => {
      if (!value) {
        return undefined;
      }
      return typeof value === "string" ? value : value.toString();
    })
    .filter((value): value is string => Boolean(value));

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
    type: (message.type as MessageType | undefined) ?? "text",
    deleted: Boolean(message.deleted),
    isEdited: Boolean((message as any).isEdited),
    isDeletedForEveryone: Boolean((message as any).isDeletedForEveryone),
    deletedAt: toOptionalIsoString((message as any).deletedAt as DateLike),
    deliveredTo: normalizeIdentifiers(message.deliveredTo),
    seenBy: normalizeIdentifiers(message.seenBy),
    threadKey: message.threadKey,
  };

  const readAt = toOptionalIsoString(message.readAt as DateLike);
  if (readAt) {
    normalized.readAt = readAt;
  }

  const editedAt = toOptionalIsoString(message.editedAt as DateLike);
  if (editedAt) {
    normalized.editedAt = editedAt;
  }

  if ((message as any).replyToMessageId) {
    normalized.replyToMessageId = toStringId(
      (message as any).replyToMessageId as ObjectIdLike
    );
  }

  if ((message as any).forwardedFrom) {
    const f = (message as any).forwardedFrom;
    normalized.forwardedFrom = {
      originalMessageId: f.originalMessageId
        ? toStringId(f.originalMessageId as ObjectIdLike)
        : undefined,
      originalSenderId: f.originalSenderId
        ? toStringId(f.originalSenderId as ObjectIdLike)
        : undefined,
      originalSenderName: f.originalSenderName,
      originalSentAt: toOptionalIsoString(f.originalSentAt as DateLike),
    };
  }

  if (message.fileUrl) {
    normalized.fileUrl = message.fileUrl as string;
  }

  if (message.fileName) {
    normalized.fileName = message.fileName as string;
  }

  return normalized;
};

export const normalizeMessageIds = (
  messages: Array<MessageLike | IMessage>
): NormalizedMessage[] => messages.map((message) => normalizeMessage(message));
