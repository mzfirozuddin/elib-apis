import { NextFunction, Request, Response } from "express";

const register = (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.body);

    res.json({ msg: "ok" });
};

export { register };
