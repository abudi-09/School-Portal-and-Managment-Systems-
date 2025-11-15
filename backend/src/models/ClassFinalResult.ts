import mongoose, { Schema, Document } from "mongoose";

export interface IRankingEntry {
  studentId: string;
  studentName: string;
  rollNo?: string;
  total: number;
  average: number;
  rank: number;
  subjectScores: Array<{
    courseId: string;
    courseName: string;
    score: number; // 0..100
  }>;
}

export interface IClassFinalResult extends Document {
  classId: string; // e.g., "11A" (lower-case canonical in DB)
  grade: string; // "11"
  section: string; // "A"
  status: "submitted" | "approved" | "rejected";
  submittedBy: mongoose.Types.ObjectId;
  submittedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rankings: IRankingEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const entrySchema = new Schema<IRankingEntry>(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNo: String,
    total: { type: Number, required: true },
    average: { type: Number, required: true },
    rank: { type: Number, required: true },
    subjectScores: [
      {
        courseId: { type: String, required: true },
        courseName: { type: String, required: true },
        score: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const finalResultSchema = new Schema<IClassFinalResult>(
  {
    classId: { type: String, required: true, lowercase: true },
    grade: { type: String, required: true },
    section: { type: String, required: true },
    status: {
      type: String,
      enum: ["submitted", "approved", "rejected"],
      required: true,
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rankings: { type: [entrySchema], default: [] },
  },
  { timestamps: true }
);

finalResultSchema.index({ classId: 1 }, { unique: true });

export default mongoose.model<IClassFinalResult>(
  "ClassFinalResult",
  finalResultSchema
);
