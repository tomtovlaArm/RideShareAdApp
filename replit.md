# UberPod Entertainment

## Overview

UberPod Entertainment is a premium in-ride entertainment and shopping experience designed for rideshare passengers. It simulates a sleek iPod-like device interface where riders can browse a marketplace (ads/sponsored products), play AI-generated trivia games, and listen to music. The app is built as a full-stack TypeScript application with a React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with 4 pages: Home, Ads, Trivia, Music
- **State Management**: TanStack React Query for server state; local React state for UI
- **Styling**: Tailwind CSS v4 (using `@import "tailwindcss"` syntax) with a dark theme (neutral/black palette), CSS variables for theming, and custom fonts (Inter + Space Grotesk)
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives. Components live in `client/src/components/ui/`
- **Animations**: Framer Motion for page transitions and UI animations
- **Layout**: Custom `PodFrame` component that renders a phone/iPod-like device frame wrapper around all page content
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend

- **Framework**: Express.js running on Node with TypeScript (compiled via tsx)
- **API Pattern**: RESTful JSON APIs under `/api/` prefix
- **Key Endpoints**:
  - `GET /api/trivia?count=N` — Generates trivia questions using OpenAI
  - `GET /api/media-proxy?url=URL` — Proxies external media (Dropbox, etc.) with correct MIME types for video/image playback
  - `GET /api/music/tracks` — Fetches music from Jamendo API
  - `POST /api/ads` / `PUT /api/ads/:id` / `DELETE /api/ads/:id` — Ad CRUD
  - `POST /api/upload` — File upload for ad media
  - Conversation/chat CRUD endpoints via Replit integrations (`/api/conversations/*`)
  - Image generation endpoint (`/api/generate-image`)
  - Voice/audio processing endpoints
- **AI Integration**: OpenAI API (via Replit AI Integrations) for trivia generation, chat, image generation, voice processing, and text-to-speech. Uses `gpt-4.1-mini` for trivia and `gpt-image-1` for images
- **Development**: Vite dev server runs as middleware on the Express server with HMR support
- **Production**: Client is built to `dist/public/`, server is bundled via esbuild to `dist/index.cjs`

### Data Storage

- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (main schema) and `shared/models/chat.ts` (chat models)
- **Tables**:
  - `users` — Basic user table with id (UUID), username, password
  - `ads` — Advertisement entries with media URLs, display settings, and QR codes
  - `media_files` — Uploaded media files stored as base64 in database (persists across deploys)
  - `conversations` — Chat conversations with id, title, createdAt
  - `messages` — Chat messages with id, conversationId (FK), role, content, createdAt
- **Media Storage**: Uploaded files are stored in the `media_files` table as base64-encoded text and served via `/api/media/:id`. This ensures uploads survive server restarts and republishes. External URLs (Dropbox, etc.) are also supported for larger files.
- **Current Storage**: `DatabaseStorage` class in `server/storage.ts` implements all CRUD operations via Drizzle ORM
- **Schema Push**: Use `npm run db:push` (drizzle-kit push) to sync schema to database
- **Environment**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Replit Integrations

The project includes pre-built Replit integration modules in both client and server:

- **Chat** (`server/replit_integrations/chat/`): Conversation and message CRUD with OpenAI streaming
- **Audio** (`server/replit_integrations/audio/` + `client/replit_integrations/audio/`): Voice recording, speech-to-text, text-to-speech, voice chat with AudioWorklet streaming
- **Image** (`server/replit_integrations/image/`): AI image generation and editing
- **Batch** (`server/replit_integrations/batch/`): Batch processing with rate limiting and retries for LLM calls

### Build System

- **Dev**: `npm run dev` starts the Express server with Vite middleware (tsx for TypeScript execution)
- **Build**: `npm run build` runs a custom build script that builds the Vite client and bundles the server with esbuild. Server dependencies are selectively bundled (allowlisted) or externalized
- **Production**: `npm start` runs the bundled `dist/index.cjs`

## External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable
- **OpenAI API**: Used through Replit AI Integrations (configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables). Powers trivia generation, chat, image generation, and voice features
- **Google Fonts**: Inter and Space Grotesk loaded from Google Fonts CDN
- **canvas-confetti**: Client-side confetti animation library (used in trivia completion)
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Key npm packages**: drizzle-orm, drizzle-zod, zod (validation), wouter (routing), framer-motion (animations), @tanstack/react-query (data fetching), shadcn/ui + Radix UI (component library)