import {
  normalizeMessage,
  DELETED_REPLY_SNIPPET,
  MessageLike,
} from "../src/utils/messages";
import { Types } from "mongoose";

const oid = () => new Types.ObjectId().toString();

const base: Partial<MessageLike> = {
  status: "unread",
  senderRole: "teacher",
  receiverRole: "teacher",
  type: "text",
  deleted: false,
  deliveredTo: [],
  seenBy: [],
  threadKey: "a:b",
  createdAt: new Date(),
};

const samples: MessageLike[] = [
  // 1) Normal message (not a reply)
  {
    ...(base as any),
    _id: oid(),
    sender: oid(),
    receiver: oid(),
    content: "Hello normal",
    threadKey: "1:2",
    createdAt: new Date(),
  },
  // 2) Reply to text (short)
  {
    ...(base as any),
    _id: oid(),
    sender: oid(),
    receiver: oid(),
    content: "Reply body",
    replyToMessageId: oid(),
    replyToMeta: {
      messageId: oid(),
      senderName: "Alice",
      type: "text",
      snippet: "Short text",
    },
    threadKey: "1:2",
    createdAt: new Date(),
  },
  // 3) Reply to deleted
  {
    ...(base as any),
    _id: oid(),
    sender: oid(),
    receiver: oid(),
    content: "Reply to deleted",
    replyToMessageId: oid(),
    replyToMeta: {
      messageId: oid(),
      senderName: "Bob",
      type: "text",
      snippet: "Will be overridden",
    },
    replyToDeleted: true,
    threadKey: "1:2",
    createdAt: new Date(),
  },
];

for (const s of samples) {
  const n = normalizeMessage(s);
  console.log(JSON.stringify(n, null, 2));
}

console.log("Deleted reply snippet constant:", DELETED_REPLY_SNIPPET);
