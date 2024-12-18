import express from "express";
import {
    createBook,
    deleteBook,
    getAllBooks,
    getCurrentUserBooks,
    getSingleBook,
    updateBook,
} from "./book.controller";
import upload from "../middlewares/multer";
import createBookValidator from "../validators/create-book-validator";
import { verifyJWT } from "../middlewares/AuthMiddleware";

const bookRouter = express.Router();

bookRouter.post(
    "/create",
    verifyJWT,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "pdfFile", maxCount: 1 },
    ]),
    createBookValidator,
    createBook
);

bookRouter.patch(
    "/update/:bookId",
    verifyJWT,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "pdfFile", maxCount: 1 },
    ]),
    createBookValidator,
    updateBook
);

bookRouter.get("/allBooks", getAllBooks);
bookRouter.get("/userBooks", verifyJWT, getCurrentUserBooks);
bookRouter.get("/:bookId", getSingleBook);
bookRouter.delete("/:bookId", verifyJWT, deleteBook);

export default bookRouter;
