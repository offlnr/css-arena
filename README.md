# CSS Arena

A real-time multiplayer CSS challenge game. Players compete to replicate an AI-generated UI component using HTML and CSS within a time limit.

## How it works

1. **Create or join a room** — set a room name, time limit, difficulty, and max players
2. **Arena** — an AI generates a unique UI challenge each match; write HTML and CSS to match it as closely as possible
3. **Results** — players are ranked by similarity score at the end of the round

## Tech stack

**Frontend**
- React 19 + TypeScript + Vite
- Monaco Editor (in-browser code editor)
- Tailwind CSS + CSS Modules
- Zustand (state management)
- Socket.io client (real-time)
- Google Gemini AI (challenge generation)

**Backend**
- Node.js + Express
- Socket.io (room management, live leaderboard, server-side timer)

## Getting started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SERVER_URL=http://localhost:3001
```

### Run

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scoring

Each submission is scored by comparing CSS properties between the player's code and the target. Exact matches score full points; partial matches (correct property, wrong value) score partial credit. Final score is 0–100%.

## License

MIT
