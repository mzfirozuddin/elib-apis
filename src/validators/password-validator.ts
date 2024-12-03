import { checkSchema } from "express-validator";

export default checkSchema({
    oldPassword: {
        errorMessage: "Old password is required!",
        trim: true,
        notEmpty: true,
    },

    newPassword: {
        errorMessage: "New password is required!",
        trim: true,
        notEmpty: true,
        isLength: {
            options: { min: 8 },
            errorMessage: "Password length should be at least 8 chars!",
        },
    },

    confNewPassword: {
        custom: {
            options: (value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error(
                        "New password and Confirm new password are not matched!"
                    );
                }

                return true;
            },
        },
    },
});
