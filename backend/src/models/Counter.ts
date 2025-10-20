import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  key: string;
  seq: number;
  updatedAt: Date;
}

const counterSchema = new Schema<ICounter>(
  {
    key: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
  }
);

const Counter = mongoose.model<ICounter>("Counter", counterSchema);

export default Counter;
