import { checkSchema } from "express-validator";

export default checkSchema({
    title: {
        errorMessage: "Book title is required!",
        notEmpty: true,
        trim: true,
    },

    genre: {
        errorMessage: "Book genre is required!",
        notEmpty: true,
        trim: true,
    },

    description: {
        errorMessage: "Book description is required!",
        notEmpty: true,
        trim: true,
    },
});
