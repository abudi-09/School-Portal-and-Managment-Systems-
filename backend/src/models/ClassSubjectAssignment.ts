import mongoose, { Document, Schema } from "mongoose";

export interface IClassSubjectAssignment extends Document {
  classId: string;
  grade: string;
  section: string;
  subject: string;
  teacher: mongoose.Types.ObjectId;
  teacherName: string;
  teacherEmail?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const classSubjectAssignmentSchema = new Schema<IClassSubjectAssignment>(
  {
    classId: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true, uppercase: true },
    section: { type: String, required: true, trim: true, uppercase: true },
    subject: { type: String, required: true, trim: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherName: { type: String, required: true, trim: true },
    teacherEmail: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

classSubjectAssignmentSchema.index(
  { classId: 1, subject: 1 },
  { unique: true }
);
classSubjectAssignmentSchema.index({ grade: 1, section: 1 });

export default mongoose.models.ClassSubjectAssignment ||
  mongoose.model<IClassSubjectAssignment>(
    "ClassSubjectAssignment",
    classSubjectAssignmentSchema
  );
