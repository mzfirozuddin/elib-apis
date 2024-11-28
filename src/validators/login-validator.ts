import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        errorMessage: "Email is requird!",
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: "Email should be a valid email!",
        },
    },

    password: {
        errorMessage: "Password is required!",
        notEmpty: true,
    },
});
