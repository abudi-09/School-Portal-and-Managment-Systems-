import mongoose, { Schema, Document } from "mongoose";

export interface IExamSchedule extends Document {
  grade: string; // e.g., "10"
  date: Date;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject: string;
  type: string; // e.g., Mid-Term, Final
  invigilator?: string;
  room?: string;
  createdBy: string; // head user id
  createdAt: Date;
  updatedAt: Date;
}

const ExamScheduleSchema = new Schema<IExamSchedule>(
  {
    grade: { type: String, required: true, index: true, trim: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    invigilator: { type: String },
    room: { type: String },
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

ExamScheduleSchema.index({ grade: 1, date: 1, startTime: 1, endTime: 1 });

export default mongoose.model<IExamSchedule>(
  "ExamSchedule",
  ExamScheduleSchema
);
