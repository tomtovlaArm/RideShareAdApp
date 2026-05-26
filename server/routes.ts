import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import path from "path";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      throw new Error("OpenAI API key (AI_INTEGRATIONS_OPENAI_API_KEY) is not configured");
    }
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function saveUploadedFile(file: Express.Multer.File): Promise<string> {
  const base64Data = file.buffer.toString("base64");
  const saved = await storage.saveMediaFile(file.originalname, file.mimetype, base64Data);
  return `/api/media/${saved.id}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid media ID" });
      const file = await storage.getMediaFile(id);
      if (!file) return res.status(404).json({ error: "File not found" });

      const buffer = Buffer.from(file.data, "base64");
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Error serving media:", error);
      res.status(500).json({ error: "Failed to serve media" });
    }
  });

  app.get("/api/trivia", async (req, res) => {
    try {
      const count = Math.min(parseInt(req.query.count as string) || 5, 10);

      const response = await getOpenAI().chat.completions.create({
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
        mediaUrl = await saveUploadedFile(req.file);
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
      if (req.file) updateData.mediaUrl = await saveUploadedFile(req.file);
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

      const apiUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=${limit}&offset=${offset}&tags=${encodeURIComponent(tags)}&include=musicinfo&audioformat=mp32&audiodlformat=mp32&order=popularity_total`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error("Jamendo API error");
      const data = await response.json();

      const tracks = (data.results || [])
        .map((t: any) => ({
          id: String(t.id),
          title: t.name,
          artist: t.artist_name,
          album: t.album_name || "",
          cover: t.album_image || t.image || "",
          duration: formatDuration(t.duration),
          durationSec: t.duration,
          audioUrl: t.audiodownload || t.audio || "",
          audioDownload: t.audiodownload || "",
        }))
        .filter((t: any) => t.audioUrl);

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

  app.get("/api/media-proxy", async (req, res) => {
    const controller = new AbortController();
    const proxyTimeout = setTimeout(() => controller.abort(), 30000);

    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith("https://")) {
        clearTimeout(proxyTimeout);
        return res.status(400).json({ error: "Invalid URL" });
      }

      const mime = getMimeFromUrl(url);
      const rangeHeader = req.headers["range"];

      const fetchHeaders: Record<string, string> = {};
      if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

      const response = await fetch(url, { redirect: "follow", headers: fetchHeaders, signal: controller.signal });
      clearTimeout(proxyTimeout);

      if (!response.ok || !response.body) {
        return res.status(502).json({ error: "Failed to fetch media" });
      }

      const contentType = mime || response.headers.get("content-type") || "application/octet-stream";
      const contentLength = response.headers.get("content-length");
      const contentRange = response.headers.get("content-range");
      const acceptRanges = response.headers.get("accept-ranges");

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Accept-Ranges", acceptRanges || "bytes");
      if (contentLength) res.setHeader("Content-Length", contentLength);
      if (contentRange) res.setHeader("Content-Range", contentRange);

      const statusCode = response.status === 206 ? 206 : 200;
      res.status(statusCode);

      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); return; }
          if (!res.write(value)) {
            await new Promise(resolve => res.once("drain", resolve));
          }
        }
      };
      pump().catch(() => res.end());
    } catch (error: any) {
      clearTimeout(proxyTimeout);
      if (error.name === "AbortError") {
        console.warn("Media proxy timed out for URL:", req.query.url);
        if (!res.headersSent) return res.status(504).json({ error: "Media fetch timed out" });
        return res.end();
      }
      console.error("Media proxy error:", error);
      if (!res.headersSent) res.status(500).json({ error: "Proxy failed" });
    }
  });

  app.post("/api/upload", upload.single("media"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const fileUrl = await saveUploadedFile(req.file);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  return httpServer;
}
