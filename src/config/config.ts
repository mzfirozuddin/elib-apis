import { config as conf } from "dotenv";
conf();

const _config = {
    port: process.env.PORT,
    db_url: process.env.MONGODB_URL,
    env: process.env.NODE_ENV,
    cors_origin: process.env.CORS_ORIGIN,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
};

export const config = Object.freeze(_config);