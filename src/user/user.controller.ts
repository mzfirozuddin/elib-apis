import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { User } from "./user.model";
import createHttpError from "http-errors";
import { uploadOnCloudinary } from "../services/cloudinary";
import { tokenService } from "../services/tokenService";
import { CustomRequest } from "../services/types";

const register = async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.body);
    //: Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
        // return res.status(400).json({ error: result.array() });  //! Error
        res.status(400).json({ error: result.array() });
        return;
    }

    //: Get user details from req.body
    const { name, email, password } = req.body;
    // console.log(name, email, password, confirmPassword);

    try {
        //: Check if user is already is present in DB
        const user = await User.findOne({ email });
        if (user) {
            const error = createHttpError(409, "Email is already exist!");
            return next(error);
        }

        //: Checks for avater
        const file = req.file as Express.Multer.File;
        // console.log(file);

        const avatarMimeType: string = file?.mimetype.split("/")[1];
        const avatarFileName: string = file?.filename;
        const avatarLocalPath: string = file?.path;
        // console.log(avatarMimeType, avatarFileName, avatarLocalPath);
        if (!avatarLocalPath) {
            const err = createHttpError(400, "Avatar file is required!");
            return next(err);
        }

        //: upload avatar on cloudinary
        const avatar = await uploadOnCloudinary(
            avatarLocalPath,
            avatarMimeType,
            avatarFileName
        );

        if (!avatar) {
            const err = createHttpError(500, "Error while uploading avatar!");
            return next(err);
        }
        //: Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        //: create user object, save on DB, remove password and refreshToken
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            avatar: avatar.url,
            refreshToken: "",
        });

        if (!newUser) {
            const err = createHttpError(500, "Error while creating user!");
            return next(err);
        }
        //: Generate accessToken and refreshToken
        const payload = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
        };
        const accessToken = tokenService.generateAccessToken(payload);
        if (!accessToken) {
            const err = createHttpError(
                400,
                "Error while generate access token!"
            );
            return next(err);
        }
        const refreshToken = tokenService.generateRefreshToken(newUser._id);
        if (!refreshToken) {
            const err = createHttpError(
                400,
                "Error while generate refresh token!"
            );
            return next(err);
        }
        //: Store refreshToken on DB
        newUser.refreshToken = refreshToken;
        await newUser.save({ validateBeforeSave: false });

        //: store tokens in cookie and return response

        const options = {
            httpOnly: true,
            secure: true,
        }; //- Now no one can change tokens from frontend
        res.status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                userId: newUser._id,
                accessToken: accessToken,
                message: "User Created Successfully.",
            });
    } catch (err) {
        next(err);
        return;
    }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
    //: Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
    }

    //: Get user details from req.body
    const { email, password } = req.body;

    try {
        //: Check user is present in DB or not
        const user = await User.findOne({ email });
        if (!user) {
            const err = createHttpError(404, "Email does not exist!");
            return next(err);
        }

        //: If user present, Check password is correct or not
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            const err = createHttpError(401, "Invalid login credentials!");
            return next(err);
        }

        //: Generate access and refresh token
        const payload = {
            id: user._id,
            email: user.email,
            name: user.name,
        };

        const accessToken = tokenService.generateAccessToken(payload);
        if (!accessToken) {
            const err = createHttpError(
                400,
                "Error while generate access token!"
            );
            return next(err);
        }

        const refreshToken = tokenService.generateRefreshToken(user._id);
        if (!refreshToken) {
            const err = createHttpError(
                400,
                "Error while generate refresh token!"
            );
            return next(err);
        }

        //: Update refresh token in DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        //: Store tokens in cookie and send response
        const option = {
            httpOnly: true,
            secure: true,
        };
        res.status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", refreshToken, option)
            .json({
                userId: user.id,
                accessToken: accessToken,
                message: "Login Successful.",
            });
    } catch (error) {
        next(error);
        return;
    }
};

const logout = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    refreshToken: "",
                },
            },
            { new: true }
        );

        const option = {
            httpOnly: true,
            secure: true,
        };

        res.status(200)
            .clearCookie("accessToken", option)
            .clearCookie("refreshToken", option)
            .json({ message: "Logout Successful." });
    } catch (error) {
        next(error);
        return;
    }
};

export { register, login, logout };
