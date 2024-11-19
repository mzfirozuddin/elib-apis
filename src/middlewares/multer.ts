import path from "node:path";
import multer from "multer";

const upload = multer({
    dest: path.resolve(__dirname, "../../public/data/uploads"),
    limits: { fileSize: 3e7 },
});

export default upload;
