const express = require("express");
const apiV1Router = require("./routes");
const errorHandler = require("./middleware/errorHandler.middleware")


const app = express();

app.use(express.json())

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", apiV1Router)


app.use(errorHandler)

module.exports = app;