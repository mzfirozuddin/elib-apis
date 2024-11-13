import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/config";

const app = express();

//:Middleware for handle CORS error
app.use(cors({ origin: config.cors_origin, credentials: true }));
//: Middleware for handle json data
app.use(express.json());
//: Middleware for handle data from url
app.use(express.urlencoded({ extended: true }));
//: Middleware for handle cookie efficiently
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Hello from home!!!");
});

//: global error handler
app.use(globalErrorHandler);

export default app;
