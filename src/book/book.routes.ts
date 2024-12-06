import express from "express";
import { createBook } from "./book.controller";

const bookRouter = express.Router();

bookRouter.post("/create", createBook);

export default bookRouter;
