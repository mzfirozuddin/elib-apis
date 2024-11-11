import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

const globalErrorHandler: ErrorRequestHandler = (
    err: HttpError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        message: err.message,
        errorStack: config.env === "Development" ? err.stack : "",
    });
};

export default globalErrorHandler;
