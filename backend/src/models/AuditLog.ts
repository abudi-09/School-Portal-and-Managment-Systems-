import mongoose, { Schema, Document, Model } from "mongoose";

export type AuditChangeType = "assign" | "reassign" | "unassign";

export interface IAuditLog extends Document {
  timestamp: Date;
  actorId?: mongoose.Types.ObjectId;
  actorName?: string;
  classId: string; // canonical like "10A"
  grade: string;
  section: string;
  subject?: string; // optional for subject-teacher assignments
  change: AuditChangeType;
  fromTeacherId?: mongoose.Types.ObjectId;
  fromTeacherName?: string;
  toTeacherId?: mongoose.Types.ObjectId;
  toTeacherName?: string;
  note?: string;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: { type: Date, default: () => new Date(), index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, trim: true },
    classId: { type: String, required: true, trim: true, uppercase: false },
    grade: { type: String, required: true, trim: true, uppercase: true },
    section: { type: String, required: true, trim: true, uppercase: true },
    subject: { type: String, trim: true },
    change: {
      type: String,
      required: true,
      enum: ["assign", "reassign", "unassign"],
    },
    fromTeacherId: { type: Schema.Types.ObjectId, ref: "User" },
    fromTeacherName: { type: String, trim: true },
    toTeacherId: { type: Schema.Types.ObjectId, ref: "User" },
    toTeacherName: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { timestamps: false }
);

auditLogSchema.index({ classId: 1, timestamp: -1 });
auditLogSchema.index({ grade: 1, section: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
