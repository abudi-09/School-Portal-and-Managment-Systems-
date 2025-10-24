import mongoose, { Schema, Document } from "mongoose";

export interface IEvaluation extends Document {
  studentId: string; // references User _id as string
  teacherId: string; // references User _id as string
  classId?: string;
  courseId?: string;
  evaluationType: string;
  score: number;
  maxScore: number;
  comment?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    studentId: { type: String, required: true, index: true },
    teacherId: { type: String, required: true, index: true },
    classId: { type: String },
    courseId: { type: String },
    evaluationType: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    comment: { type: String, trim: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

EvaluationSchema.index({ teacherId: 1, date: -1 });
EvaluationSchema.index({ studentId: 1, date: -1 });

const Evaluation = mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);
export default Evaluation;
