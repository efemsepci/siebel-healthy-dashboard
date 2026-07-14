const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const namespaceRoutes = require("./routes/namespaceRoutes");
const podRoutes = require("./routes/podRoutes");
const siebelRoutes = require("./routes/siebelRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", authRoutes);

app.use("/api", namespaceRoutes);
app.use("/api", podRoutes);
app.use("/api", siebelRoutes);

//frontend build directory
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(5000, () => {
  console.log("Backend port 5000 üzerinde çalışıyor.");
});
