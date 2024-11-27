import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { IPayload } from "./types";

class TokenService {
    generateAccessToken(payload: IPayload) {
        return jwt.sign(
            { sub: payload.id, email: payload.email, name: payload.name },
            config.accessTokenSecret as string,
            { expiresIn: config.accessTokenExpiry, algorithm: "HS256" }
        );
    }

    generateRefreshToken(id: string) {
        return jwt.sign({ sub: id }, config.refreshTokenSecret as string, {
            expiresIn: config.refreshTokenExpiry,
            algorithm: "HS256",
        });
    }
}

export const tokenService = new TokenService();
// export default TokenService;
