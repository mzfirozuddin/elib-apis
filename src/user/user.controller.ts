import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { User } from "./user.model";
import createHttpError from "http-errors";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../services/cloudinary";
import { tokenService } from "../services/tokenService";
import { CustomRequest, IPayload } from "../services/types";
import { config } from "../config/config";

const register = async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.body);
    //: Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
        //!TODO: If validation failed then we have to delete file from local server
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
        //!==================================== We will see avatar later ======================================================
        /* 
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
        */
        //!=======================================================================================
        //: Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        //: create user object, save on DB, remove password and refreshToken
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            avatar: "",
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
        const payload: IPayload = {
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

const self = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const user = req?.user;
        res.status(200).json(user);
    } catch (error) {
        next(error);
        return;
    }
};

const refreshAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    //: Collect token
    const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!incomingRefreshToken) {
        const err = createHttpError(401, "Unauthorized Access!");
        return next(err);
    }

    try {
        //: Verify the token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            config.refreshTokenSecret as string
        );

        //: check the user
        const user = await User.findById(decodedToken?.sub);
        if (!user) {
            const err = createHttpError(401, "Invalid refresh token!");
            return next(err);
        }

        //: Compare incoming token with DB stored token
        if (incomingRefreshToken !== user.refreshToken) {
            const err = createHttpError(
                401,
                "Refresh token has expired or used!"
            );
            return next(err);
        }

        //: Generate new access and refresh token
        const payload: IPayload = {
            id: user._id,
            name: user.name,
            email: user.email,
        };
        const newAccessToken = tokenService.generateAccessToken(payload);
        if (!newAccessToken) {
            const err = createHttpError(
                400,
                "Error while generate access token!"
            );
            return next(err);
        }

        const newRefreshToken = tokenService.generateRefreshToken(user._id);
        if (!newRefreshToken) {
            const err = createHttpError(
                400,
                "Error while generate refresh token!"
            );
            return next(err);
        }

        //: store new refresh token in DB
        user.refreshToken = newRefreshToken;
        user.save({ validateBeforeSave: false });

        //: Store access and refresh token in cookie and return response
        const option = {
            httpOnly: true,
            secure: true,
        };
        res.status(200)
            .cookie("accessToken", newAccessToken, option)
            .cookie("refreshToken", newRefreshToken, option)
            .json({
                userId: user._id,
                accessToken: newAccessToken,
                message: "Access token refreshed.",
            });
    } catch (error) {
        next(error);
        return;
    }
};

const changePassword = async (
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

    //: Collect data from req.body
    const { oldPassword, newPassword } = req.body;

    try {
        //: check the user
        const user = await User.findById(req.user?._id);
        if (!user) {
            const err = createHttpError(400, "User not found!");
            return next(err);
        }

        //: check old password is correct or not
        const isPasswordCorrect = await bcrypt.compare(
            oldPassword,
            user.password
        );
        if (!isPasswordCorrect) {
            const err = createHttpError(401, "Incorrect old password");
            return next(err);
        }

        //: if everything is ok then hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        //: update the password in DB
        user.password = hashedNewPassword;
        user.save({ validateBeforeSave: false });

        //: Return response
        res.status(200).json({
            userId: user._id,
            message: "Password changed successfully.",
        });
    } catch (error) {
        next(error);
        return;
    }
};

const updateProfileDetails = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    //: Collect data from req.body and validate
    const { name } = req.body;
    if (!name) {
        const err = createHttpError(400, "Name is required!");
        return next(err);
    }

    try {
        //: update the details
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: { name: name },
            },
            { new: true }
        ).select("-password -refreshToken");

        if (!user) {
            const err = createHttpError(500, "Something went wrong!");
            return next(err);
        }

        //: return response
        res.status(200).json({
            userId: user._id,
            message: "Update profile successfully.",
        });
    } catch (error) {
        next(error);
        return;
    }
};

const updateAvatar = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    //: collect avatar file and check
    const file = req.file as Express.Multer.File;

    const avatarMimeType: string = file?.mimetype.split("/")[1];
    const avatarFileName: string = file?.filename;
    const avatarLocalPath: string = file?.path;

    // console.log(avatarMimeType, avatarFileName, avatarLocalPath);

    if (!avatarLocalPath) {
        const err = createHttpError(400, "Avatar file is required!");
        return next(err);
    }

    try {
        //: upload file on cloudinary
        const avatar = await uploadOnCloudinary(
            avatarLocalPath,
            avatarMimeType,
            avatarFileName
        );

        // console.log(avatar);

        if (!avatar) {
            const err = createHttpError(500, "Error while uploading avatar!");
            return next(err);
        }

        //: Update the avatar in DB
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: { avatar: avatar.url },
            },
            { new: true }
        ).select("-password -refreshToken");

        if (!user) {
            const err = createHttpError(500, "Something went wrong!");
            return next(err);
        }

        //:delete old avatar from cloudinary
        //http://res.cloudinary.com/drqredubp/image/upload/v1732991427/elib-asset/og8p0aitakrxa1j9avde.png
        // publicId = elib-asset/og8p0aitakrxa1j9avde
        const avatarFileSplit = req.user?.avatar.split("/");
        const oldAvatarFilePublicId =
            avatarFileSplit?.at(-2) +
            "/" +
            avatarFileSplit?.at(-1)?.split(".").at(-2);
        // console.log(oldAvatarFilePublicId);

        await deleteFromCloudinary(oldAvatarFilePublicId);

        res.status(200).json({
            userId: user._id,
            message: "Avatar updated successfully.",
        });
    } catch (error) {
        next(error);
        return;
    }
};

export {
    register,
    login,
    logout,
    self,
    refreshAccessToken,
    changePassword,
    updateProfileDetails,
    updateAvatar,
};
