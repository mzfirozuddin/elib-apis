import { IUser } from "../user/userTypes";

export interface IBook {
    _id: string;
    title: string;
    author: IUser;
    genre: string;
    description: string;
    coverImage: string; // cloud url
    pdfFile: string;
    createdAt: string;
    updatedAt: string;
}
