import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are Style Kart’s AI Support Assistant. Be friendly, helpful, and concise. Assist users with shopping, orders, products, returns, and general questions.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_output_tokens: 200,
    });

    const reply =
      response.output_text ||
      "Sorry, I couldn’t generate a response.";

    return res.json({ reply });
  } catch (err) {
    console.error("AI Chat Error:", err);
    return res.status(500).json({ reply: "AI service failed. Try again later." });
  }
});

export default router;
