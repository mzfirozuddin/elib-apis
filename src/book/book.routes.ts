import express from "express";
import { createBook } from "./book.controller";
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

export default bookRouter;
