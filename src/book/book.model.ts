import mongoose from "mongoose";
import { IBook } from "./bookTypes";
import { User } from "../user/user.model";

const bookSchema = new mongoose.Schema<IBook>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: User,
            required: true,
        },
        genre: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
            required: true,
        },
        pdfFile: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Book = mongoose.model("Book", bookSchema);
