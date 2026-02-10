import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/trivia", async (req, res) => {
    try {
      const count = Math.min(parseInt(req.query.count as string) || 5, 10);

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `You are a trivia question generator. Generate exactly ${count} multiple-choice trivia questions. Each question should have 4 options and one correct answer. Mix categories: science, history, pop culture, geography, sports, etc. Make them fun and engaging for an Uber ride.

Return ONLY valid JSON in this exact format, no markdown:
[
  {
    "id": 1,
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B"
  }
]

The correctAnswer MUST exactly match one of the options.`,
          },
          {
            role: "user",
            content: `Generate ${count} unique trivia questions.`,
          },
        ],
        temperature: 1.0,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const questions = JSON.parse(cleaned);

      res.json(questions);
    } catch (error) {
      console.error("Error generating trivia:", error);
      res.status(500).json({ error: "Failed to generate trivia questions" });
    }
  });

  return httpServer;
}
