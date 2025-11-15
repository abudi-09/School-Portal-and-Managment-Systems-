import mongoose, { Schema, Types, Document } from "mongoose";

export interface ISavedMessage extends Document {
  userId: Types.ObjectId;
  messageId: Types.ObjectId;
  createdAt: Date;
}

const SavedMessageSchema = new Schema<ISavedMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SavedMessageSchema.index({ userId: 1, messageId: 1 }, { unique: true });

const SavedMessage = mongoose.model<ISavedMessage>(
  "SavedMessage",
  SavedMessageSchema
);
export default SavedMessage;
