import app from "./src/app";
import { config } from "./src/config/config";

const startServer = () => {
    const PORT = config.port || 3000;
    try {
        app.listen(PORT, () =>
            console.log(`Server is listening on port: ${PORT}`)
        );
    } catch (err) {
        console.log("Error in server", err);
        process.exit(1);
    }
};

startServer();
