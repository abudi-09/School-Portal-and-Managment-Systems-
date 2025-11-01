import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISection extends Document {
  label: string;
  normalizedLabel: string;
  grade: 9 | 10 | 11 | 12;
  stream?: "natural" | "social";
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    label: { type: String, required: true, trim: true },
    normalizedLabel: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    grade: { type: Number, required: true, enum: [9, 10, 11, 12] },
    // Optional stream for senior grades (11,12)
    stream: {
      type: String,
      enum: ["natural", "social"],
    },
    capacity: { type: Number },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

sectionSchema.pre<ISection>("validate", function (next) {
  // Ensure TypeScript knows the `this` type inside middleware.
  const doc = this as ISection;
  doc.normalizedLabel = (doc.label ?? "").trim().toLowerCase();
  // Enforce stream rules based on grade
  if (doc.grade === 11 || doc.grade === 12) {
    if (!doc.stream) {
      return next(new Error("Stream is required for grades 11 and 12"));
    }
  } else {
    // Ensure no stream stored for junior grades
    delete (doc as any).stream;
  }
  next();
});

// Make uniqueness include stream so senior grades can have same labeled sections
// across different streams (e.g., "STEM" in Natural and Social).
sectionSchema.index(
  { grade: 1, normalizedLabel: 1, stream: 1 },
  { unique: true }
);

const SectionModel: Model<ISection> =
  mongoose.models.Section || mongoose.model<ISection>("Section", sectionSchema);

export default SectionModel;
