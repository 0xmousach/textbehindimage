// Need a few routes here for processing the video
// e.g.,  POST /api/compose Do the whole process in one shot       

import express from "express"
import { composeImage } from "../controller/composeController.js"


const router = express.Router();

router.post("/", composeImage);

export default router;