import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment {
  filename: string;
  url: string;
}

export interface IAnnouncement extends Document {
  title: string;
  postedBy: { id: mongoose.Types.ObjectId | string; name: string; role?: string };
  audience: "school" | "teacher"; // who the announcement targets
  date: Date;
  type: string; // exam, event, info, class, school, etc.
  message: string;
  attachments: IAttachment[];
  readBy: Array<mongoose.Types.ObjectId>;
  createdBy?: mongoose.Types.ObjectId | string;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    postedBy: {
      id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      name: { type: String, required: true },
      role: { type: String },
    },
    audience: { type: String, enum: ["school", "teacher"], default: "school" },
    date: { type: Date, required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    attachments: { type: [AttachmentSchema], default: [] },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
