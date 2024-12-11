import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/config";

//: Configuration
cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
});

//: Upload an file
const uploadOnCloudinary = async (
    localFilePath: string,
    mimeType: string,
    fileName: string
) => {
    if (!localFilePath) {
        return null;
    }

    try {
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            filename_override: fileName,
            folder: "elib-asset",
            format: mimeType,
        });
        console.log("File uploaded successfully.", uploadResult.url);
        //: After successful upload file will be deleted from local server
        await fs.promises.unlink(localFilePath);
        return uploadResult;
    } catch (error) {
        //: If any error then delete from local server
        fs.unlinkSync(localFilePath);
        console.log("Error in file upload: ", error);

        return null;
    }
};

const uploadPdfOnCloudinary = async (
    localFilePath: string,
    fileName: string
) => {
    if (!localFilePath) {
        return null;
    }

    try {
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw",
            filename_override: fileName,
            folder: "elib-asset-pdf",
            format: "pdf",
        });
        console.log("File uploaded successfully.", uploadResult.url);
        //: After successful upload file will be deleted from local server
        await fs.promises.unlink(localFilePath);
        return uploadResult;
    } catch (error) {
        //: If any error then delete from local server
        fs.unlinkSync(localFilePath);
        console.log("Error in file upload: ", error);

        return null;
    }
};

const deleteFromCloudinary = async (cloudinaryPublicId: string) => {
    try {
        if (!cloudinaryPublicId) {
            return null;
        }

        const deleteResult = await cloudinary.uploader.destroy(
            cloudinaryPublicId,
            {
                invalidate: true,
            }
        );

        console.log("Delete From Cloudinary: ", deleteResult);

        return deleteResult;
    } catch (error) {
        console.log("Error on deleteFromCloudinary :: ", error);
        return null;
    }
};

const deletePdfFromCloudinary = async (cloudinaryPublicId: string) => {
    try {
        if (!cloudinaryPublicId) {
            return null;
        }

        const deleteResult = await cloudinary.uploader.destroy(
            cloudinaryPublicId,
            {
                invalidate: true,
                resource_type: "raw",
            }
        );

        console.log("Delete From Cloudinary: ", deleteResult);

        return deleteResult;
    } catch (error) {
        console.log("Error on deleteFromCloudinary :: ", error);
        return null;
    }
};

export {
    uploadOnCloudinary,
    uploadPdfOnCloudinary,
    deleteFromCloudinary,
    deletePdfFromCloudinary,
};
