import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISection extends Document {
  label: string;
  normalizedLabel: string;
  grade: 9 | 10 | 11 | 12;
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
    capacity: { type: Number },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

sectionSchema.pre("validate", function (next) {
  this.normalizedLabel = (this.label ?? "").trim().toLowerCase();
  next();
});

sectionSchema.index({ grade: 1, normalizedLabel: 1 }, { unique: true });

const SectionModel: Model<ISection> =
  mongoose.models.Section || mongoose.model<ISection>("Section", sectionSchema);

export default SectionModel;
