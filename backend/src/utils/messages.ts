import { Types } from "mongoose";
import {
  IMessage,
  MessageRole,
  MessageStatus,
  MessageType,
  ReplyToMessageType,
} from "../models/Message";

// Snippet shown for replies whose original message has been deleted.
// Business rule: presented consistently without trailing period.
export const DELETED_REPLY_SNIPPET = "This message was deleted";

export type ObjectIdLike = Types.ObjectId | string;
export type DateLike = Date | string | null | undefined;

type MaybeObjectIdLike = ObjectIdLike | undefined | null;

export interface MessageLike {
  _id: ObjectIdLike;
  sender: ObjectIdLike;
  receiver: ObjectIdLike;
  participants?: MaybeObjectIdLike[];
  content: string;
  status: MessageStatus;
  senderRole: MessageRole;
  receiverRole: MessageRole;
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
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
  replyToDeleted?: boolean;
  replyToMeta?: {
    messageId: string;
    senderName: string;
    type: ReplyToMessageType;
    snippet: string;
  };
  editCount?: number;
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
  mimeType?: string;
  fileSize?: number;
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
  replyTo?: {
    messageId: string;
    senderName: string;
    type: ReplyToMessageType;
    snippet: string;
  };
  replyToDeleted?: boolean;
  deliveredTo: string[];
  seenBy: string[];
  threadKey: string;
  editCount?: number;
  reactions?: Array<{ emoji: string; users: string[] }>;
}

const toStringId = (value: ObjectIdLike): string => String(value);

const normalizeIdentifiers = (values?: MaybeObjectIdLike[]): string[] =>
  (values ?? [])
    .map((value) => {
      if (!value) {
        return undefined;
      }
      return String(value);
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

  const deletedAt = toOptionalIsoString((message as any).deletedAt as DateLike);
  if (deletedAt) {
    normalized.deletedAt = deletedAt;
  }

  if ((message as any).replyToMessageId) {
    normalized.replyToMessageId = toStringId(
      (message as any).replyToMessageId as ObjectIdLike
    );
  }

  if ((message as any).forwardedFrom) {
    const f = (message as any).forwardedFrom;
    const forwarded: NonNullable<NormalizedMessage["forwardedFrom"]> = {};

    if (f.originalMessageId) {
      forwarded.originalMessageId = toStringId(
        f.originalMessageId as ObjectIdLike
      );
    }

    if (f.originalSenderId) {
      forwarded.originalSenderId = toStringId(
        f.originalSenderId as ObjectIdLike
      );
    }

    if (typeof f.originalSenderName === "string") {
      forwarded.originalSenderName = f.originalSenderName;
    }

    const originalSentAt = toOptionalIsoString(f.originalSentAt as DateLike);
    if (originalSentAt) {
      forwarded.originalSentAt = originalSentAt;
    }

    if (Object.keys(forwarded).length > 0) {
      normalized.forwardedFrom = forwarded;
    }
  }

  // Only include reply metadata if present (replyToMeta is stored) AND
  // the message is actually a reply (has replyToMessageId). Non-reply
  // messages must surface replyTo as null/undefined.
  if ((message as any).replyToMessageId && (message as any).replyToMeta) {
    const r = (message as any).replyToMeta;
    const replyTo: NonNullable<NormalizedMessage["replyTo"]> = {
      messageId:
        typeof r.messageId === "string"
          ? r.messageId
          : toStringId(r.messageId as ObjectIdLike),
      senderName:
        typeof r.senderName === "string" && r.senderName.trim().length > 0
          ? r.senderName
          : "Unknown",
      type: (r.type as ReplyToMessageType | undefined) ?? "text",
      snippet:
        typeof r.snippet === "string" && r.snippet.trim().length > 0
          ? r.snippet
          : "Text message",
    };

    normalized.replyTo = replyTo;
  }

  if (normalized.replyTo && Boolean((message as any).replyToDeleted)) {
    normalized.replyTo.snippet = DELETED_REPLY_SNIPPET;
    normalized.replyToDeleted = true;
  }

  if (message.fileUrl) {
    normalized.fileUrl = message.fileUrl as string;
  }

  if (message.fileName) {
    normalized.fileName = message.fileName as string;
  }

  if ((message as any).mimeType) {
    normalized.mimeType = (message as any).mimeType as string;
  }

  const size = (message as any).fileSize;
  if (typeof size === "number" && !Number.isNaN(size)) {
    normalized.fileSize = size as number;
  }

  const editCount = (message as any).editCount;
  if (typeof editCount === "number" && !Number.isNaN(editCount)) {
    normalized.editCount = editCount;
  }

  const reactions = (message as any).reactions as
    | Array<{ emoji?: string; userId?: string }>
    | undefined;
  if (Array.isArray(reactions) && reactions.length > 0) {
    const grouped = new Map<string, Set<string>>();
    reactions.forEach((r) => {
      const e = (r.emoji ?? "").trim();
      const u = (r.userId ?? "").trim();
      if (!e || !u) return;
      if (!grouped.has(e)) grouped.set(e, new Set());
      grouped.get(e)!.add(u);
    });
    if (grouped.size > 0) {
      normalized.reactions = Array.from(grouped.entries()).map(
        ([emoji, users]) => ({ emoji, users: Array.from(users) })
      );
    }
  }

  return normalized;
};

export const normalizeMessageIds = (
  messages: Array<MessageLike | IMessage>
): NormalizedMessage[] => messages.map((message) => normalizeMessage(message));
