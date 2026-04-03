const express = require("express");
const db = require("../firebase");

const router = express.Router();

// GET traffic data
router.get("/", async (req, res) => {
  try {
    const snap = await db.collection("traffic_data").get();
    res.json(snap.docs.map(d => d.data()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;