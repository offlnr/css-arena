import Groq from 'groq-sdk';
import type { Challenge } from '../data/challenges';
import { CHALLENGES } from '../data/challenges';
import { formatHTML } from '../utils/formatHTML';

// Difficulty values must stay in Spanish — the server and AI prompt reference them directly.
const AI_PROMPT = `You are a CSS challenge generator for a competitive coding game.

Generate a UNIQUE, CREATIVE HTML/CSS component challenge. Every call must produce a DIFFERENT component type and visual style.

Return ONLY a valid JSON object — no markdown, no backticks, no extra text:
{
  "title": "Component name (e.g. 'Tarjeta de Producto')",
  "difficulty": "Fácil" or "Medio" or "Difícil",
  "description": "One sentence in Spanish describing what to replicate",
  "html": "The HTML markup as a single string",
  "css": "The complete target CSS solution as a single string"
}

Strict rules:
- Rotate through component types each call: profile card, pricing card, notification/toast, stats widget, button group, login form, badge row, social post card, product card, weather widget, music player card, testimonial card, etc.
- body must have: display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; font-family:sans-serif; and a light background color (#e8ecf0, #f0f4f8, #f5f0ff, #fff0f0, etc. — vary it)
- Use 2–4 distinct accent colors that match the theme (not just grays)
- Must include: border-radius, box-shadow, and good spacing/padding
- Component fits in a 280–380px wide card
- HTML: 10–22 lines, all styled via class names
- CSS: 30–60 lines, specific pixel/rem values, NO comments
- Add visual polish: gradients, colored borders, icons as unicode chars (✓ ★ ♥ ↗), hover states
- difficulty mapping: Fácil = simple single card, Medio = 2–3 sections or states, Difícil = complex layout or responsive elements`;

interface RawGeneratedChallenge {
  title: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  description: string;
  html: string;
  css: string;
}

function pickRandomChallenge(): Challenge {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
}

function parseAIResponse(text: string): RawGeneratedChallenge {
  // The model sometimes wraps JSON in markdown code fences — strip them.
  const clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(clean) as RawGeneratedChallenge;
  if (!parsed.html || !parsed.css || !parsed.title) throw new Error('AI response missing required fields');
  return parsed;
}

export async function generateChallenge(): Promise<Challenge> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

  if (!apiKey) {
    console.warn('[ChallengeGenerator] VITE_GROQ_API_KEY not set — using built-in challenge');
    return pickRandomChallenge();
  }

  try {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 1.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: AI_PROMPT }],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const data = parseAIResponse(raw);

    return {
      id: `gen-${Date.now()}`,
      title: data.title,
      difficulty: data.difficulty,
      description: data.description,
      startHTML: formatHTML(data.html),
      startCSS: '/* Write your CSS here */\n',
      targetHTML: data.html,
      targetCSS: data.css,
    };
  } catch (err) {
    console.error('[ChallengeGenerator] Generation failed, falling back to built-in:', err);
    return pickRandomChallenge();
  }
}
