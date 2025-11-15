import mongoose, { Document, Schema, Types } from "mongoose";

export type MessageStatus = "read" | "unread";
export type MessageRole = "admin" | "head" | "teacher";

export type MessageType =
  | "text"
  | "image"
  | "file"
  | "doc"
  | "audio"
  | "video"
  | "voice"; // distinct voice message (recorded inline)

export type ReplyToMessageType =
  | "text"
  | "photo"
  | "file"
  | "document"
  | "audio"
  | "video";

export interface MessageDeliveryStatus {
  deliveredTo: string[];
  seenBy: string[];
}

export interface ForwardedFrom {
  originalMessageId: Types.ObjectId;
  originalSenderId: Types.ObjectId | string;
  originalSenderName?: string;
  originalSentAt?: Date;
}

export interface ReplyToMeta {
  messageId: string;
  senderName: string;
  type: ReplyToMessageType;
  snippet: string;
}

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  participants: Types.ObjectId[];
  senderRole: MessageRole;
  receiverRole: MessageRole;
  content: string;
  status: MessageStatus;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  deleted: boolean;
  editedAt?: Date;
  isEdited?: boolean;
  editCount?: number;
  deliveredTo: string[];
  seenBy: string[];
  readAt?: Date;
  threadKey: string;
  replyToMessageId?: Types.ObjectId;
  replyToMeta?: ReplyToMeta;
  replyToDeleted?: boolean;
  forwardedFrom?: ForwardedFrom;
  forwardedAt?: Date;
  isDeletedForEveryone?: boolean;
  hiddenFor?: string[];
  deletedAt?: Date;
  reactions?: Array<{
    emoji: string;
    userId: string;
  }>;
  // Voice message specific metadata
  voiceUrl?: string; // URL to stored voice audio
  duration?: number; // total length seconds (preferred new field)
  waveform?: number[]; // 0-100 amplitude samples (preferred new field)
  isPlayed?: boolean; // whether receiver has played it
  voiceDuration?: number; // seconds
  voiceWaveform?: number[]; // normalized amplitude samples 0..1 * 100 or 0..255
  voicePlayedBy?: string[]; // userIds who have played the voice message
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator(value: Types.ObjectId[]) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "Participants must include exactly two user identifiers.",
      },
    },
    senderRole: {
      type: String,
      enum: ["admin", "head", "teacher"],
      required: true,
    },
    receiverRole: {
      type: String,
      enum: ["admin", "head", "teacher"],
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "doc", "audio", "video", "voice"],
      default: "text",
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    replyToMeta: {
      messageId: { type: String },
      senderName: { type: String },
      type: {
        type: String,
        enum: ["text", "photo", "file", "document", "audio", "video"],
        default: "text",
      },
      snippet: { type: String },
    },
    replyToDeleted: {
      type: Boolean,
      default: false,
    },
    forwardedFrom: {
      originalMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
      originalSenderId: { type: Schema.Types.ObjectId, ref: "User" },
      originalSenderName: { type: String },
      originalSentAt: { type: Date },
    },
    forwardedAt: {
      type: Date,
    },
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    hiddenFor: {
      type: [String],
      default: [],
    },
    deletedAt: {
      type: Date,
    },
    reactions: [
      new Schema(
        {
          emoji: { type: String, required: true, trim: true },
          userId: { type: String, required: true },
        },
        { _id: false }
      ),
    ],
    deliveredTo: {
      type: [String],
      default: [],
    },
    seenBy: {
      type: [String],
      default: [],
    },
    readAt: {
      type: Date,
    },
    threadKey: {
      type: String,
      required: true,
      index: true,
    },
    voiceDuration: {
      type: Number,
      min: 0,
    },
    voiceWaveform: {
      type: [Number],
      default: [],
    },
    voicePlayedBy: {
      type: [String],
      default: [],
    },
    voiceUrl: {
      type: String,
    },
    duration: {
      type: Number,
      min: 0,
    },
    waveform: {
      type: [Number],
      default: [],
    },
    isPlayed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ participants: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, status: 1 });

function buildThreadKey(a: Types.ObjectId, b: Types.ObjectId): string {
  const [first, second] = [a, b]
    .map((id) => id.toString())
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  return `${first}:${second}`;
}

MessageSchema.pre(
  "validate",
  function messagePreValidate(this: IMessage, next) {
    if (!this.sender || !this.receiver) {
      return next(new Error("Sender and receiver are required."));
    }

    this.participants = [this.sender, this.receiver];
    this.threadKey = buildThreadKey(this.sender, this.receiver);
    return next();
  }
);

export const getThreadKey = (a: Types.ObjectId, b: Types.ObjectId) =>
  buildThreadKey(a, b);

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
