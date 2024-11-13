import { config as conf } from "dotenv";
conf();

const _config = {
    port: process.env.PORT,
    db_url: process.env.MONGODB_URL,
    env: process.env.NODE_ENV,
    cors_origin: process.env.CORS_ORIGIN,
};

export const config = Object.freeze(_config);
