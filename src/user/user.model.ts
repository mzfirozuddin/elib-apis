import mongoose from "mongoose";
import { IUser } from "./userTypes";

const userSchema = new mongoose.Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        avatar: {
            type: String, //: Cloudinary Url
            // required: true,
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
