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
    try {
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            filename_override: fileName,
            folder: "elib-asset",
            format: mimeType,
        });
        console.log("File uploaded successfully.", uploadResult.url);
        //: After successful upload file will be deleted from local server
        fs.unlinkSync(localFilePath);
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

export { uploadOnCloudinary, deleteFromCloudinary };
