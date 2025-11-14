import { Types } from "mongoose";
import Message from "../models/Message";
import { MessageLike } from "../utils/messages";

export const flagRepliesForDeletedOriginal = async (
  originalMessageId: Types.ObjectId
): Promise<MessageLike[]> => {
  await Message.updateMany(
    { replyToMessageId: originalMessageId, replyToDeleted: { $ne: true } },
    { $set: { replyToDeleted: true } }
  );

  return Message.find<MessageLike>({
    replyToMessageId: originalMessageId,
  }).lean<MessageLike[]>();
};
