import express from "express";
import {
    changePassword,
    login,
    logout,
    refreshAccessToken,
    register,
    self,
} from "./user.controller";
import registerValidator from "../validators/register-validator";
import upload from "../middlewares/multer";
import loginValidator from "../validators/login-validator";
import { verifyJWT } from "../middlewares/AuthMiddleware";
import passwordValidator from "../validators/password-validator";

const userRouter = express.Router();

userRouter.post(
    "/register",
    upload.single("avatar"),
    registerValidator,
    register
);

userRouter.post("/login", loginValidator, login);
userRouter.post("/refresh-tokens", refreshAccessToken);

//: Secured routes
userRouter.post("/logout", verifyJWT, logout);
userRouter.get("/self", verifyJWT, self);
userRouter.post(
    "/change-password",
    passwordValidator,
    verifyJWT,
    changePassword
);

export default userRouter;
