const express = require("express");
const { Redis } = require("ioredis");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

app.get("/cache/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const data = await redis.get(key);
    if (data) {
      return res.status(200).json({ key, data });
    }
    return res.status(404).json({ message: "Key not found" });
  } catch (error) {
    return res.status(500).json({ error: "Redis error", details: error.message });
  }
});

app.post("/cache", async (req, res) => {
  const { key, value, ttl } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: "Key and value are required" });
  }

  try {
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
    return res.status(201).json({ message: "Cached successfully", key, value });
  } catch (error) {
    return res.status(500).json({ error: "Redis error", details: error.message });
  }
});

// Delete Cache Entry
app.delete("/cache/:key", async (req, res) => {
  const { key } = req.params;

  try {
    const deleted = await redis.del(key);
    if (deleted) {
      return res.status(200).json({ message: "Deleted successfully" });
    }
    return res.status(404).json({ error: "Key not found" });
  } catch (error) {
    return res.status(500).json({ error: "Redis error", details: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Hello Cracto");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
