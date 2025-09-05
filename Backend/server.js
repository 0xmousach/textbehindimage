import express from "express"
import composeRoutes from "./routes/compose.js"

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

app.use("/api/compose", composeRoutes);

app.listen(5001, () => {
    console.log("Server is running on port:", PORT)
});