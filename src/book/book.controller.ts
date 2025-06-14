import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import {
    deleteFromCloudinary,
    deletePdfFromCloudinary,
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

const updateBook = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    //: Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        //: find the book
        const bookId = req.params.bookId;
        const book = await Book.findById(bookId);
        if (!book) {
            const err = createHttpError(404, "Book not found!");
            return next(err);
        }

        //: Check this user is authorized or not for update this book
        // console.log(book.author.toString());
        // console.log(req.user?._id.toString());

        if (book.author.toString() !== req.user?._id.toString()) {
            const err = createHttpError(
                403,
                "You are not authorized to update this book!"
            );
            return next(err);
        }

        //: collect the data from req.body
        const { title, genre, description } = req.body;

        //: Collect the files if send by user
        const files = req.files as {
            [fieldName: string]: Express.Multer.File[];
        }; // Multiple file type

        let coverImageUrl = "";
        let bookPdfUrl = "";

        //: Handle cover image
        if (files && files.coverImage && files.coverImage.length > 0) {
            //* For cover image
            const coverImageMimeType = files.coverImage[0].mimetype
                .split("/")
                .at(-1);
            const coverImageFileName = files.coverImage[0].filename;
            const coverImageLocalFilePath = files.coverImage[0].path;
            if (!coverImageLocalFilePath) {
                const err = createHttpError(
                    400,
                    "Cover image file is required!"
                );
                return next(err);
            }

            //* upload cover image in cloudinary
            const coverImageUploadResult = await uploadOnCloudinary(
                coverImageLocalFilePath,
                coverImageMimeType as string,
                coverImageFileName
            );
            if (!coverImageUploadResult?.url) {
                const err = createHttpError(
                    500,
                    "Error while uploading the file in server!"
                );
                return next(err);
            }

            coverImageUrl = coverImageUploadResult.secure_url;
        }

        //: Handle pdf file
        if (files && files.pdfFile && files.pdfFile.length > 0) {
            //* For pdf file
            const pdfFileName = files.pdfFile[0].filename;
            const pdfFileLocalPath = files.pdfFile[0].path;
            if (!pdfFileLocalPath) {
                const err = createHttpError(400, "Book pdf file is required!");
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

            bookPdfUrl = pdfFileResult.secure_url;
        }

        //: Now update the book in DB
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            {
                title: title,
                genre: genre,
                description: description,
                coverImage: coverImageUrl ? coverImageUrl : book.coverImage,
                pdfFile: bookPdfUrl ? bookPdfUrl : book.pdfFile,
            },
            { new: true }
        );

        //: Now delete the old coverImage and pdf file
        if (coverImageUrl) {
            const oldCoverImageSplit = book?.coverImage.split("/");
            const oldCoverImagePublicId =
                oldCoverImageSplit?.at(-2) +
                "/" +
                oldCoverImageSplit?.at(-1)?.split(".").at(-2);
            // console.log(oldCoverImagePublicId);

            await deleteFromCloudinary(oldCoverImagePublicId);
        }

        if (bookPdfUrl) {
            // https://res.cloudinary.com/drqredubp/raw/upload/v1733684061/elib-asset-pdf/acijg5mthzu3ojknyozo.pdf
            //* Public ID => elib-asset-pdf/acijg5mthzu3ojknyozo.pdf
            const oldPdfSplit = book?.pdfFile.split("/");
            const oldPdfFilePublicId =
                oldPdfSplit?.at(-2) + "/" + oldPdfSplit?.at(-1);
            // console.log(oldPdfFilePublicId);

            await deletePdfFromCloudinary(oldPdfFilePublicId);
        }

        //: Return response
        res.status(200).json({
            bookId: updatedBook?._id,
            message: "Book updated successfully.",
        });
    } catch (error) {
        console.log("ERR: Error in updateBook!");
        next(error);
        return;
    }
};

const getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //: Get data from query params for pagination
        const page = Number(req.query.currentPage);
        const currentPage = Number.isNaN(page) ? 1 : page;

        const count = Number(req.query.perPage);
        const perPage = Number.isNaN(count) ? 6 : count;

        // console.log("Current Page: ", currentPage, "Per Page: ", perPage);

        const books = await Book.find()
            .populate("author", "name")
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        const totalCount = await Book.countDocuments();

        res.status(200).json({
            currentPage,
            perPage,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / perPage),
            data: books,
        });
    } catch (error) {
        console.log("ERR: Error in getAllBooks!");
        next(error);
        return;
    }
};

const getCurrentUserBooks = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        //: Get data from query params for pagination
        const page = Number(req.query.currentPage);
        const currentPage = Number.isNaN(page) ? 1 : page;

        const count = Number(req.query.perPage);
        const perPage = Number.isNaN(count) ? 6 : count;

        // console.log("Current Page: ", currentPage, "Per Page: ", perPage);

        const books = await Book.find({ author: req.user?._id })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        // const totalCount = await Book.countDocuments();

        res.status(200).json({
            currentPage,
            perPage,
            // totalRecords: totalCount,
            // totalPages: Math.ceil(totalCount / perPage),
            data: books,
        });
    } catch (error) {
        console.log("ERR: Error in getCurrentUserBooks!");
        next(error);
        return;
    }
};

const getSingleBook = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const bookId = req.params.bookId;
        // console.log(bookId);

        const book = await Book.findOne({ _id: bookId }).populate(
            "author",
            "name"
        );
        // console.log(book);

        if (!book) {
            const err = createHttpError(404, "Book not found!");
            return next(err);
        }

        res.status(200).json(book);
    } catch (error) {
        console.log("ERR: Error in getSingleBook!");
        next(error);
        return;
    }
};

const deleteBook = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const bookId = req.params.bookId;

        //: Check book present or not
        const book = await Book.findOne({ _id: bookId });
        if (!book) {
            const err = createHttpError(404, "Book not found!");
            return next(err);
        }

        //: Check user have access to delete book or not
        if (book.author.toString() !== req.user?._id.toString()) {
            const err = createHttpError(
                403,
                "You are not authorized to delete this book!"
            );
            return next(err);
        }

        //: Now delete files from cloudinary
        const coverImageSplit = book?.coverImage.split("/");
        const coverImagePublicId =
            coverImageSplit?.at(-2) +
            "/" +
            coverImageSplit?.at(-1)?.split(".").at(-2);
        // console.log(oldCoverImagePublicId);

        await deleteFromCloudinary(coverImagePublicId);

        // https://res.cloudinary.com/drqredubp/raw/upload/v1733684061/elib-asset-pdf/acijg5mthzu3ojknyozo.pdf
        //* Public ID => elib-asset-pdf/acijg5mthzu3ojknyozo.pdf
        const pdfSplit = book?.pdfFile.split("/");
        const pdfFilePublicId = pdfSplit?.at(-2) + "/" + pdfSplit?.at(-1);
        // console.log(oldPdfFilePublicId);

        await deletePdfFromCloudinary(pdfFilePublicId);

        //: Delete entry from DB
        await Book.deleteOne({ _id: bookId });

        //: Return response
        res.status(204).json({
            bookId: book._id,
            message: "Book deleted successfully.",
        });
    } catch (error) {
        console.log("ERR: Error in deleteBook!");
        next(error);
        return;
    }
};

export {
    createBook,
    updateBook,
    getAllBooks,
    getCurrentUserBooks,
    getSingleBook,
    deleteBook,
};
