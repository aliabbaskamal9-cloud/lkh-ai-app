import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Temporary in-memory database
let users = {};

// Signup API
app.post("/signup", (req, res) => {
  const { email } = req.body;

  if (users[email]) {
    return res.send("User already exists");
  }

  users[email] = {
    plan: "free",
    tokens: 25
  };

  res.send("Signup successful with 25 free tokens");
});

// Chat API with token control
app.post("/chat", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!users[email]) {
      return res.status(400).send("User not found");
    }

    if (users[email].tokens <= 0) {
      return res.status(403).send("Buy subscription");
    }

    users[email].tokens -= 1;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }]
    });

    res.json({
      reply: response.choices[0].message.content,
      remainingTokens: users[email].tokens
    });

  } catch (error) {
    res.status(500).send("Error generating response");
  }
});

// Admin activate subscription
app.post("/activate", (req, res) => {
  const { email } = req.body;

  if (!users[email]) {
    return res.send("User not found");
  }

  users[email].plan = "paid";
  users[email].tokens = 1000;

  res.send("Subscription activated with 1000 tokens");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
