const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const authRoutes = require("./routes/auth");

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
