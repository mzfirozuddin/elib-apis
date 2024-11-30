import { NextFunction, Response } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "../user/user.model";
import { CustomRequest } from "../services/types";

export const verifyJWT = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        //: Collect Token
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            const err = createHttpError(401, "Unauthorized Request!");
            return next(err);
        }

        //: verify token
        const decodedToken = jwt.verify(
            token,
            config.accessTokenSecret as string
        );

        //: check for user
        const user = await User.findById(decodedToken?.sub).select(
            "-password -refreshToken -__v"
        );
        if (!user) {
            const err = createHttpError(401, "Inavlid access token!");
            return next(err);
        }

        //: add the user in req object
        req.user = user;
        next();
    } catch (err) {
        next(err);
        return;
    }
};
