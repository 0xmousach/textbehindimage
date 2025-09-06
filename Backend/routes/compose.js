// Need a few routes here for processing the video
// e.g.,  POST /api/compose Do the whole process in one shot       

import express from "express"
<<<<<<< HEAD:Backend/src/routes/compose.js
import { createImage } from "../controller/composeController.js"
=======
import { composeImage } from "../controller/composeController.js"
>>>>>>> ef4808e6caa5fbbcdcffb542fcefe84c588d2ab3:Backend/routes/compose.js

const router = express.Router();

router.post("/", composeImage);

export default router;