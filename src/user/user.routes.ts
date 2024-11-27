import express from "express";
import { register } from "./user.controller";
import registerValidator from "../validators/register-validator";
import upload from "../middlewares/multer";

const userRouter = express.Router();

userRouter.post(
    "/register",
    upload.single("avatar"),
    registerValidator,
    register
);

export default userRouter;
