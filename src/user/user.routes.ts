import express from "express";
import { login, register } from "./user.controller";
import registerValidator from "../validators/register-validator";
import upload from "../middlewares/multer";
import loginValidator from "../validators/login-validator";

const userRouter = express.Router();

userRouter.post(
    "/register",
    upload.single("avatar"),
    registerValidator,
    register
);

userRouter.post("/login", loginValidator, login);

export default userRouter;
