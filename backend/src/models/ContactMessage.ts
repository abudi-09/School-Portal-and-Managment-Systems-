import mongoose, { Document, Schema } from "mongoose";

export type ContactMessageStatus = "new" | "in_progress" | "resolved";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  role?: "student" | "teacher" | "head" | "admin" | "parent" | "visitor";
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["student", "teacher", "head", "admin", "parent", "visitor"],
      required: false,
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ createdAt: -1 });

const ContactMessage = mongoose.model<IContactMessage>(
  "ContactMessage",
  ContactMessageSchema
);

export default ContactMessage;
