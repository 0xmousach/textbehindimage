import express from "express"
import designRoutes from "./routes/designRoutes.js"

const app = express();

app.use("api/designs", designRoutes);

app.listen(5001, () => {
    console.log("Server is running on port 5001")
});