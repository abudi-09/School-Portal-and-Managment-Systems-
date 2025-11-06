import mongoose, { Document, Schema } from "mongoose";

export type AnnouncementType = "school" | "teacher";

export interface IAnnouncementAttachment {
  filename: string;
  url: string; // absolute or server-relative URL to download/preview
  mimeType?: string;
  size?: number;
}

export interface IAnnouncementEdit {
  title?: string;
  message?: string;
  attachments?: IAnnouncementAttachment[];
  audience?: {
    scope?: "all" | "teachers" | "students" | "class";
    classId?: string;
  };
  date?: Date;
  editedBy?: {
    user?: mongoose.Types.ObjectId;
    name?: string;
    role?: string;
  };
  editedAt?: Date;
}

export interface IAnnouncement extends Document {
  title: string;
  postedBy: {
    user: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };
  date: Date;
  type: AnnouncementType;
  message: string;
  attachments: IAnnouncementAttachment[];
  audience: {
    scope: "all" | "teachers" | "students" | "class";
    classId?: string; // optional class identifier/name for class-targeted posts
  };
  archived?: boolean;
  edits?: IAnnouncementEdit[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAnnouncementAttachment>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    postedBy: {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      role: {
        type: String,
        required: true,
        enum: ["admin", "head", "teacher"],
      },
    },
    date: { type: Date, required: true, default: () => new Date() },
    type: { type: String, required: true, enum: ["school", "teacher"] },
    message: { type: String, required: true },
    attachments: { type: [AttachmentSchema], default: [] },
    audience: {
      scope: {
        type: String,
        enum: ["all", "teachers", "students", "class"],
        default: "all",
        required: true,
      },
      classId: { type: String },
    },
    archived: { type: Boolean, default: false },
    // keep a history of edits for version integrity (who edited, when, and previous content)
    edits: {
      type: [
        new Schema(
          {
            title: { type: String },
            message: { type: String },
            attachments: { type: [AttachmentSchema], default: [] },
            audience: {
              scope: {
                type: String,
                enum: ["all", "teachers", "students", "class"],
              },
              classId: { type: String },
            },
            date: { type: Date },
            editedBy: {
              user: { type: Schema.Types.ObjectId, ref: "User" },
              name: { type: String },
              role: { type: String },
            },
            editedAt: { type: Date },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ type: 1, date: -1 });
AnnouncementSchema.index({ "postedBy.user": 1 });
AnnouncementSchema.index({ archived: 1 });
AnnouncementSchema.index({ "audience.scope": 1 });

const Announcement = mongoose.model<IAnnouncement>(
  "Announcement",
  AnnouncementSchema
);

export default Announcement;
