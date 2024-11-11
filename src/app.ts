import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

app.get("/", (req, res) => {
    res.send("Hello from home!!!");
});

//: global error handler
app.use(globalErrorHandler);

export default app;
