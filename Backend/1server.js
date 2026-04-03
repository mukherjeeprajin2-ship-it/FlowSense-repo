require("dotenv").config();

const express = require("express");
const cors = require("cors");

const trafficRoutes = require("./routes/traffic");
const complaintRoutes = require("./routes/complaints");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/traffic", trafficRoutes);
app.use("/complaints", complaintRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});