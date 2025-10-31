import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  name: string;
  normalizedName: string;
  grade: 9 | 10 | 11 | 12;
  stream?: "natural" | "social";
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    grade: { type: Number, required: true, enum: [9, 10, 11, 12] },
    isMandatory: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

courseSchema.pre<ICourse>("validate", function (next) {
  const doc = this as ICourse;
  doc.normalizedName = (doc.name ?? "").trim().toLowerCase();
  next();
});

courseSchema.index({ grade: 1, normalizedName: 1 }, { unique: true });

const CourseModel: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);

export default CourseModel;
