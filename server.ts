import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/dbConn";

const startServer = async () => {
    await connectDB(); //: Connect DB
    const PORT = config.port || 3000;

    app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));
};

startServer();
