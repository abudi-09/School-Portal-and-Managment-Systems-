import mongoose, { Document, Schema } from "mongoose";

export type AnnouncementType = "school" | "teacher";

export interface IAnnouncementAttachment {
	filename: string;
	url: string; // absolute or server-relative URL to download/preview
	mimeType?: string;
	size?: number;
}

export interface IAnnouncement extends Document {
	title: string;
	postedBy: {
		user: mongoose.Types.ObjectId;
		name: string;
		role: string;
	};
	date: Date;
	type: AnnouncementType;
	message: string;
	attachments: IAnnouncementAttachment[];
	createdAt: Date;
	updatedAt: Date;
}

const AttachmentSchema = new Schema<IAnnouncementAttachment>(
	{
		filename: { type: String, required: true },
		url: { type: String, required: true },
		mimeType: { type: String },
		size: { type: Number },
	},
	{ _id: false }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
	{
		title: { type: String, required: true, trim: true },
		postedBy: {
			user: { type: Schema.Types.ObjectId, ref: "User", required: true },
			name: { type: String, required: true },
			role: { type: String, required: true, enum: ["admin", "head", "teacher"] },
		},
		date: { type: Date, required: true, default: () => new Date() },
		type: { type: String, required: true, enum: ["school", "teacher"] },
		message: { type: String, required: true },
		attachments: { type: [AttachmentSchema], default: [] },
	},
	{ timestamps: true }
);

AnnouncementSchema.index({ type: 1, date: -1 });
AnnouncementSchema.index({ "postedBy.user": 1 });

const Announcement = mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default Announcement;

