const express = require("express");
const db = require("../utils/db");


const router = express.Router();

// TEMP TEST ROUTE
router.get("/",  (req, res) => {
  res.json({ message: "✅ Alerts API is working, DB not queried yet" });
});

module.exports = router;
