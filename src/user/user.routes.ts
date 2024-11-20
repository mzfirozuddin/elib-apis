import express from "express";
import { register } from "./user.controller";

const userRouter = express.Router();

userRouter.post("/register", register);

export default userRouter;
