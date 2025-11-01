import mongoose, { Document, Schema } from "mongoose";

export interface IClassHeadAssignment extends Document {
  classId: string;
  grade: string;
  section: string;
  headTeacher: mongoose.Types.ObjectId;
  headTeacherName: string;
  headTeacherEmail?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const classHeadAssignmentSchema = new Schema<IClassHeadAssignment>(
  {
    classId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    headTeacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    headTeacherName: {
      type: String,
      required: true,
      trim: true,
    },
    headTeacherEmail: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

classHeadAssignmentSchema.index({ grade: 1, section: 1 });

export default mongoose.model<IClassHeadAssignment>(
  "ClassHeadAssignment",
  classHeadAssignmentSchema
);
