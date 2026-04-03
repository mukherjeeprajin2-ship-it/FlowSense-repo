const express = require("express");
const db = require("../firebase");

const router = express.Router();

// GET complaints
router.get("/", async (req, res) => {
  try {
    const snap = await db.collection("complaints").get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD complaint
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();

    const doc = await db.collection("complaints").add({
      ...data,
      status: "Open",
      timestamp: now,
      updated_at: now,
    });

    res.json({ id: doc.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE complaint
router.patch("/:id", async (req, res) => {
  try {
    await db.collection("complaints").doc(req.params.id).update({
      status: req.body.status,
      updated_at: new Date().toISOString(),
    });

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;