import mongoose from "mongoose";

export function idToString(id: any): string {
  if (!id && id !== 0) return "";
  if (typeof id === "string") return id;
  // mongoose ObjectId
  if (
    mongoose &&
    mongoose.Types &&
    mongoose.Types.ObjectId &&
    id instanceof mongoose.Types.ObjectId
  ) {
    return id.toHexString();
  }
  if (typeof id.toString === "function") return id.toString();
  return String(id);
}
