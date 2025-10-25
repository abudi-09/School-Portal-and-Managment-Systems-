import mongoose, { Document, Schema } from "mongoose";

export interface IUserAnnouncementRead extends Document {
	user: mongoose.Types.ObjectId;
	announcement: mongoose.Types.ObjectId;
	readAt: Date;
}

const UserAnnouncementReadSchema = new Schema<IUserAnnouncementRead>(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		announcement: {
			type: Schema.Types.ObjectId,
			ref: "Announcement",
			required: true,
		},
		readAt: { type: Date, default: () => new Date() },
	},
	{ timestamps: true }
);

UserAnnouncementReadSchema.index({ user: 1, announcement: 1 }, { unique: true });

const UserAnnouncementRead = mongoose.model<IUserAnnouncementRead>(
	"UserAnnouncementRead",
	UserAnnouncementReadSchema
);

export default UserAnnouncementRead;

