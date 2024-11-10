import mongoose from "mongoose";
import { config } from "./config";
import { DB_NAME } from "../../constant";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Connected to DB Successfully.");
        });

        mongoose.connection.on("error", (err) => {
            console.log("Error in connecting to database!!!", err);
        });

        await mongoose.connect(`${config.db_url}/${DB_NAME}`);
    } catch (err) {
        console.log("ERROR: Failed to connect DB!!!", err);
        process.exit(1);
    }
};

export default connectDB;
