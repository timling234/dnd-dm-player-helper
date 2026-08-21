# D&D DM Helper

> Early prototype — March 2026

D&D DM Helper is a web-based AI assistant for a **human Dungeon Master**. I started the prototype in March 2026 after learning Dungeons & Dragons for the first time and volunteering to DM for a group of friends who were also new to the game. Preparing a session made the DM's workload immediately visible: tracking rules, story progression, player actions, hidden information, and game state while keeping the table engaged.

This project explores how an AI assistant can reduce that cognitive load while preserving the creativity, judgment, and control of the human DM. It is an early personal prototype, not a complete game platform and not an autonomous AI Dungeon Master.

## Prototype Features

- Separate DM and player interfaces
- English and Simplified Chinese UI with a persistent language switcher
- Live DM-to-player session updates over WebSocket
- Browser speech transcription with speaker labels
- LLM-assisted narration and suggested player actions
- Private DM notes, check suggestions, and state changes
- Local session history and memory summarization
- Offline stub mode, so the core demo runs without an API key

## Run Locally

Requirements: Node.js 18 or later and npm.

1. Install the backend dependencies from the project root: `npm install`
2. Install the frontend dependencies: `cd web` then `npm install`
3. Return to the project root and run `restart.bat` on Windows, or start the two services separately:
   - Backend: `npm start`
   - Frontend: from `web`, run `npm run dev -- --host 0.0.0.0 --port 5174`
4. Open the interfaces:
   - DM Console: <http://localhost:5174/#/dm>
   - Player Screen: <http://localhost:5174/#/player>

The backend uses the built-in English demo response when no API key is configured. To enable DeepSeek, copy `.env.example` to `.env` and add a valid key. Never commit `.env`.

Use the language button above either interface to switch between English and Simplified Chinese. UI labels, speech recognition, offline demo content, and new LLM output follow the selected language. Each language keeps separate local session history, so switching languages does not mix English and Chinese content. Legacy saved history is migrated to the matching language when possible.

## Project Structure

- `server/` — Express/WebSocket backend and LLM integration
- `web/` — React and TypeScript frontend
- `docs/` — optional Windows background-service setup
- `tools/` — local Cloudflare/PM2 helper scripts

## Prototype Scope

The current flow is intentionally small: the human DM starts or transcribes a scene, requests suggestions, chooses what to use, and privately reviews checks or state notes. The AI supports the DM; it does not replace their authority over rules, pacing, or the story.

Potential future work includes richer rules awareness, structured campaign state, multi-user identity, authentication, more reliable cross-device transcription, and a complete online play experience.

## Security

- `.env` and generated dependency/build files are ignored by Git.
- `.env.example` contains placeholders only.
- The published repository should not include API keys, Cloudflare credentials, or local tunnel configuration.

## License

This prototype is shared for portfolio and educational review purposes.

