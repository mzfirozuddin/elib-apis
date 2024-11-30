import express from "express";
import { login, logout, register, self } from "./user.controller";
import registerValidator from "../validators/register-validator";
import upload from "../middlewares/multer";
import loginValidator from "../validators/login-validator";
import { verifyJWT } from "../middlewares/AuthMiddleware";

const userRouter = express.Router();

userRouter.post(
    "/register",
    upload.single("avatar"),
    registerValidator,
    register
);

userRouter.post("/login", loginValidator, login);

//: Secured routes
userRouter.post("/logout", verifyJWT, logout);
userRouter.get("/self", verifyJWT, self);

export default userRouter;
