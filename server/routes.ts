import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const isProd = process.env.NODE_ENV === "production";
const uploadDir = isProd
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "client/public/assets/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (isProd) {
    const express = await import("express");
    app.use("/uploads", express.default.static(uploadDir));
  }
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

  app.get("/api/ads", async (_req, res) => {
    try {
      const allAds = await storage.getAllAds();
      res.json(allAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ error: "Failed to fetch ads" });
    }
  });

  app.get("/api/ads/:id", async (req, res) => {
    try {
      const ad = await storage.getAd(parseInt(req.params.id));
      if (!ad) return res.status(404).json({ error: "Ad not found" });
      res.json(ad);
    } catch (error) {
      console.error("Error fetching ad:", error);
      res.status(500).json({ error: "Failed to fetch ad" });
    }
  });

  const optionalUpload = (req: any, res: any, next: any) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      upload.single("media")(req, res, next);
    } else {
      next();
    }
  };

  app.post("/api/ads", optionalUpload, async (req, res) => {
    try {
      let mediaUrl = req.body.mediaUrl || "";
      if (req.file) {
        mediaUrl = isProd
          ? `/uploads/${req.file.filename}`
          : `/assets/uploads/${req.file.filename}`;
      }

      if (!mediaUrl) {
        return res.status(400).json({ error: "Media file or URL is required" });
      }

      if (!req.body.name || !req.body.brand) {
        return res.status(400).json({ error: "Name and brand are required" });
      }

      const adData = {
        name: req.body.name,
        brand: req.body.brand,
        price: req.body.price || "",
        type: req.body.type || "image",
        mediaUrl,
        description: req.body.description,
        qrUrl: req.body.qrUrl || "",
        sortOrder: parseInt(req.body.sortOrder) || 0,
        displayDuration: parseInt(req.body.displayDuration) || 5,
      };

      const ad = await storage.createAd(adData);
      res.status(201).json(ad);
    } catch (error) {
      console.error("Error creating ad:", error);
      res.status(500).json({ error: "Failed to create ad" });
    }
  });

  app.put("/api/ads/:id", optionalUpload, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const existing = await storage.getAd(id);
      if (!existing) return res.status(404).json({ error: "Ad not found" });

      const updateData: Record<string, any> = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.brand !== undefined) updateData.brand = req.body.brand;
      if (req.body.price !== undefined) updateData.price = req.body.price;
      if (req.body.type !== undefined) updateData.type = req.body.type;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.qrUrl !== undefined) updateData.qrUrl = req.body.qrUrl;
      if (req.body.sortOrder !== undefined) updateData.sortOrder = parseInt(req.body.sortOrder);
      if (req.body.displayDuration !== undefined) updateData.displayDuration = parseInt(req.body.displayDuration);
      if (req.file) updateData.mediaUrl = isProd ? `/uploads/${req.file.filename}` : `/assets/uploads/${req.file.filename}`;
      else if (req.body.mediaUrl !== undefined) updateData.mediaUrl = req.body.mediaUrl;

      const updated = await storage.updateAd(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(500).json({ error: "Failed to update ad" });
    }
  });

  app.delete("/api/ads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAd(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ error: "Failed to delete ad" });
    }
  });

  app.get("/api/music/tracks", async (req, res) => {
    try {
      const clientId = process.env.JAMENDO_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: "Jamendo API not configured" });
      }

      const tags = (req.query.tags as string) || "chillout";
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      const offset = parseInt(req.query.offset as string) || 0;

      const apiUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=${limit}&offset=${offset}&tags=${encodeURIComponent(tags)}&include=musicinfo&audioformat=mp32&order=popularity_total`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error("Jamendo API error");
      const data = await response.json();

      const tracks = (data.results || []).map((t: any) => ({
        id: t.id,
        title: t.name,
        artist: t.artist_name,
        album: t.album_name || "",
        cover: t.album_image || t.image,
        duration: formatDuration(t.duration),
        durationSec: t.duration,
        audioUrl: t.audio,
        audioDownload: t.audiodownload,
      }));

      res.json(tracks);
    } catch (error) {
      console.error("Error fetching music:", error);
      res.status(500).json({ error: "Failed to fetch music" });
    }
  });

  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
  };

  function getMimeFromUrl(url: string): string | null {
    const pathname = new URL(url).pathname.toLowerCase();
    for (const [ext, mime] of Object.entries(mimeTypes)) {
      if (pathname.endsWith(ext)) return mime;
    }
    return null;
  }

  const resolvedUrlCache = new Map<string, { url: string; expiresAt: number }>();

  app.get("/api/media-resolve", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith("https://")) {
        return res.status(400).json({ error: "Invalid URL" });
      }

      const cached = resolvedUrlCache.get(url);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json({ directUrl: cached.url });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "manual",
      });
      clearTimeout(timeout);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (location) {
          resolvedUrlCache.set(url, { url: location, expiresAt: Date.now() + 3600000 });
          return res.json({ directUrl: location });
        }
      }

      res.json({ directUrl: url });
    } catch (error) {
      console.error("Media resolve error:", error);
      res.json({ directUrl: url });
    }
  });

  app.post("/api/upload", upload.single("media"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const fileUrl = isProd ? `/uploads/${req.file.filename}` : `/assets/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  return httpServer;
}
