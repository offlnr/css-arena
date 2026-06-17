# ⚡ CSS Arena

> **Multiplayer CSS battle game.** Race against other players to replicate an AI-generated UI component using HTML & CSS — whoever gets closest wins.

---

## What is it?

CSS Arena drops all players into the same challenge: an AI generates a unique UI component, you see the target, and you have a limited time to match it pixel by pixel using your own HTML and CSS. Your score is calculated visually — the closer your result looks to the target, the higher you rank.

Every match is unique. No two challenges repeat.

---

## Features

- **AI-generated challenges** — Google Gemini creates a new UI component for every match
- **Live preview** — your result renders in real time as you type
- **Visual scoring** — similarity is measured by comparing rendered pixels, not just code
- **Real-time leaderboard** — see everyone's score update live during the match
- **Monaco Editor** — VS Code-grade editor with CSS autocompletion and context-aware suggestions
- **Room system** — create or join rooms with custom time limits and difficulty

---

## How a match works

```
1. Create or join a room  →  set time limit + difficulty
2. AI generates a unique challenge
3. You get the target preview + a blank editor
4. Write HTML & CSS to match it as closely as possible
5. Time runs out → scores are locked → winner is revealed
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Styling | Tailwind CSS + CSS Modules |
| State | Zustand |
| Real-time | Socket.io client/server |
| AI | Google Gemini (`@google/generative-ai`) |
| Backend | Node.js + Express + Socket.io |

---

## Getting started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Install

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

### Environment

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

Open [http://localhost:5173](http://localhost:5173) and start playing.

---

## Scoring

Scores are calculated by rendering both the target and your submission in a canvas, then comparing them pixel by pixel. This means visual accuracy is what counts — not how clean your code is.

| Score | Result |
|---|---|
| 75 – 100% | Strong match |
| 40 – 74% | Partial match |
| 0 – 39% | Far off |

---

## License

MIT
