import mongoose, { Schema, Document } from "mongoose";

export interface IClassSchedule extends Document {
  section: string; // e.g., "10A"
  day: string; // e.g., "Monday"
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject: string;
  teacherId?: string;
  room?: string;
  createdBy: string; // head user id
  createdAt: Date;
  updatedAt: Date;
}

const ClassScheduleSchema = new Schema<IClassSchedule>(
  {
    section: { type: String, required: true, index: true, trim: true },
    day: { type: String, required: true, trim: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    teacherId: { type: String },
    room: { type: String },
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

ClassScheduleSchema.index({ section: 1, day: 1, startTime: 1, endTime: 1 });

export default mongoose.model<IClassSchedule>(
  "ClassSchedule",
  ClassScheduleSchema
);
