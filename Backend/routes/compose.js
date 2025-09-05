// Need a few routes here for processing the video
// e.g.,  POST /api/compose Do the whole process in one shot       

import express from "express"
import createImage from "../controller/composeController.js"

const router = express.Router();

router.post("/", createImage);

export default router;