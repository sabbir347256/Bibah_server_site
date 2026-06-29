import { Schema, model } from "mongoose";
import { IMeetup } from "./meetup.interfaces";

const meetupSchema = new Schema<IMeetup>(
  {
    userId: { type: String, required: true },
    targetUserId: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Meetup = model<IMeetup>("Meetup", meetupSchema);