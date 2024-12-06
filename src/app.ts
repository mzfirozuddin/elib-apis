import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/config";
import userRouter from "./user/user.routes";
import bookRouter from "./book/book.routes";

const app = express();

//:Middleware for handle CORS error
app.use(cors({ origin: config.cors_origin, credentials: true }));
//: Middleware for handle json data
app.use(express.json());
//: Middleware for handle data from url
app.use(express.urlencoded({ extended: true }));
//: Middleware for handle cookie efficiently
app.use(cookieParser());

app.get("/health-check", (req, res) => {
    res.status(200).json({ message: "Server Health Is Good." });
});

//: Register user router
app.use("/api/user", userRouter);
//: Register book router
app.use("/api/books", bookRouter);

//: global error handler
app.use(globalErrorHandler);

export default app;
