import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  name: string;
  normalizedName: string;
  grade: 9 | 10 | 11 | 12;
  stream?: "natural" | "social";
  isCommon?: boolean;
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
    // Optional stream for junior grades (9,10). For senior grades (11,12), either stream OR isCommon is required.
    stream: {
      type: String,
      enum: ["natural", "social"],
    },
    isCommon: { type: Boolean, default: false },
    isMandatory: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

courseSchema.pre<ICourse>("validate", function (next) {
  const doc = this as ICourse;
  doc.normalizedName = (doc.name ?? "").trim().toLowerCase();
  // Enforce stream/common rules
  if (doc.grade === 11 || doc.grade === 12) {
    const hasStream = !!doc.stream;
    const isCommon = !!doc.isCommon;
    if (!hasStream && !isCommon) {
      return next(
        new Error(
          "For grades 11 and 12, either stream must be set or the course must be marked common"
        )
      );
    }
    if (hasStream && isCommon) {
      return next(
        new Error(
          "Course cannot be both stream-specific and common at the same time"
        )
      );
    }
  } else {
    // For grades 9/10 ensure no stream/common flags
    delete (doc as any).stream;
    doc.isCommon = false;
  }
  next();
});
// Partial unique indexes to enforce uniqueness for common and stream-specific courses separately
courseSchema.index(
  { grade: 1, normalizedName: 1 },
  { unique: true, partialFilterExpression: { isCommon: true } as any }
);
courseSchema.index(
  { grade: 1, normalizedName: 1, stream: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [{ isCommon: false }, { isCommon: { $exists: false } }],
    } as any,
  }
);

const CourseModel: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);

export default CourseModel;
