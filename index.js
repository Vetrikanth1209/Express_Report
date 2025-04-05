const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("./config/db");
const axios = require("axios");
const consul = require("./middleware/consul");

// ✅ Import Controllers
const attendanceRoutes = require("./controllers/attendanceController");
const certificateRoutes = require("./controllers/certificateController");
const resultRoutes = require("./controllers/resultsController");
const individualRoutes = require("./controllers/individualController");
const overallRoutes = require("./controllers/overallController");

// ✅ Initialize Express App
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Register Routes
app.use("/attendance", attendanceRoutes);
app.use("/certificates", certificateRoutes);
app.use("/individual", individualRoutes);
app.use("/results", resultRoutes);
app.use("/overall", overallRoutes);

app.get("/", (req, res) => res.send("Server is awake!"));

// Keep-Alive Logic
const KEEP_ALIVE_URL = "https://express-report.onrender.com";
const CONSUL_URL = "https://consul-hn1i.onrender.com";

const sendKeepAlive = async (url, name) => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`✅ Keep-alive request to ${name} sent. Status: ${response.status}`);
  } catch (err) {
    console.error(`❌ Keep-alive request to ${name} failed: ${err.message}`);
  }
};

// Ping both services
setTimeout(() => {
  sendKeepAlive(KEEP_ALIVE_URL, "Express app"); // Initial call for Express
  sendKeepAlive(CONSUL_URL, "Consul"); // Initial call for Consul
  setInterval(() => {
    sendKeepAlive(KEEP_ALIVE_URL, "Express app");
    sendKeepAlive(CONSUL_URL, "Consul");
  }, 240000); // Every 5 minutes
}, 10000);


// ✅ Start Server & Register Service in Consul
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});