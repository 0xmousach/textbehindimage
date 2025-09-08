import express from "express"
import multer from "multer"
import { composeImage } from "../controller/composeController.js"

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

router.post("/", upload.single("image"), composeImage);

export default router;