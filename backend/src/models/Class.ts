import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClass extends Document {
  classId: string; // canonical id like "11a"
  grade: string; // e.g., "11"
  section: string; // e.g., "A"
  name: string; // e.g., "Grade 11 - Section A"
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    classId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    grade: { type: String, required: true, uppercase: true, trim: true },
    section: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

classSchema.index({ grade: 1, section: 1 }, { unique: true });

const ClassModel: Model<IClass> =
  mongoose.models.Class || mongoose.model<IClass>("Class", classSchema);
export default ClassModel;
