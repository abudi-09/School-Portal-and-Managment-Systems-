import mongoose, { Document, Schema, Types } from "mongoose";

export type MessageStatus = "read" | "unread";
export type MessageRole = "admin" | "head" | "teacher";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  participants: Types.ObjectId[];
  senderRole: MessageRole;
  receiverRole: MessageRole;
  content: string;
  status: MessageStatus;
  readAt?: Date;
  threadKey: string;
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
      required: true,
      trim: true,
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
      required: true,
    },
    readAt: {
      type: Date,
    },
    threadKey: {
      type: String,
      required: true,
      index: true,
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
