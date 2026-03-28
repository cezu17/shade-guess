const express = require("express");
const router = express.Router();
const Score = require("../models/Score");

router.post("/", async (req, res) => {
  try {
    const { username, totalScore } = req.body;

    if (!username || totalScore === undefined) {
      return res.status(400).json({ message: "Username and totalScore are required" });
    }

    const newScore = new Score({
      username,
      totalScore,
    });

    const savedScore = await newScore.save();
    res.status(201).json(savedScore);
  } catch (error) {
    res.status(500).json({ message: "Failed to save score" });
  }
});

router.get("/", async (req, res) => {
  try {
    const scores = await Score.find()
      .sort({ totalScore: -1, createdAt: -1 })
      .limit(10);

    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch scores" });
  }
});

module.exports = router;