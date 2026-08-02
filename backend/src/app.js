const express = require("express");
const cookieParser = require("cookie-parser")
const apiV1Router = require("./routes");
const errorHandler = require("./middleware/errorHandler.middleware")
const cors = require("cors")


const app = express();

app.use(express.json())
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", apiV1Router)


app.use(errorHandler)

module.exports = app;