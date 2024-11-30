import { Request } from "express";

export interface IPayload {
    id: string;
    email: string;
    name: string;
}

export interface ICurrentUser {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustomRequest extends Request {
    user?: ICurrentUser;
}
