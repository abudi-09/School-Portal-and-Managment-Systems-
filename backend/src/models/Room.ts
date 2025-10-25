import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  capacity?: number;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    capacity: { type: Number },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model<IRoom>("Room", RoomSchema);
