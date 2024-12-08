import { NextFunction, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import {
    uploadOnCloudinary,
    uploadPdfOnCloudinary,
} from "../services/cloudinary";
import { CustomRequest } from "../services/types";
import { Book } from "./book.model";

const createBook = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    //: validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
        //!TODO: If validation failed then we have to delete files from local server
        res.status(400).json({ error: result.array() });
        return;
    }

    //: Collect the book details from req.body
    const { title, genre, description } = req.body;

    //: Collect the files and upload on cloudinary
    const files = req.files as { [fieldName: string]: Express.Multer.File[] }; // Multiple file type

    //* For cover image
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const coverImageFileName = files.coverImage[0].filename;
    const coverImageLocalFilePath = files.coverImage[0].path;
    if (!coverImageLocalFilePath) {
        const err = createHttpError(400, "Cover image file is required!");
        return next(err);
    }

    //* For pdf file
    const pdfFileName = files.pdfFile[0].filename;
    const pdfFileLocalPath = files.pdfFile[0].path;
    if (!pdfFileLocalPath) {
        const err = createHttpError(400, "Book pdf file is required!");
        return next(err);
    }

    try {
        //* upload cover image in cloudinary
        const coverImageResult = await uploadOnCloudinary(
            coverImageLocalFilePath,
            coverImageMimeType as string,
            coverImageFileName
        );
        if (!coverImageResult?.url) {
            const err = createHttpError(
                500,
                "Error while uploading the file in server!"
            );
            return next(err);
        }

        //* upload pdf file in cloudinary
        const pdfFileResult = await uploadPdfOnCloudinary(
            pdfFileLocalPath,
            pdfFileName
        );

        if (!pdfFileResult?.url) {
            const err = createHttpError(
                500,
                "Error while uploading the file in server!"
            );
            return next(err);
        }

        //: create book object and save in DB
        const newBook = await Book.create({
            title,
            genre,
            description,
            author: req.user?._id,
            coverImage: coverImageResult.secure_url,
            pdfFile: pdfFileResult.secure_url,
        });

        if (!newBook) {
            const err = createHttpError(
                500,
                "Error in create new book in DB!!"
            );
            return next(err);
        }

        //: Return response
        res.status(201).json({
            bookId: newBook._id,
            message: "Book Created Successfully.",
        });
    } catch (error) {
        console.log("ERROR: in book controller!!!");
        next(error);
        return;
    }
};

export { createBook };
