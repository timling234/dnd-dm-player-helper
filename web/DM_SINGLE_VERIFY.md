# Single-Device DM Console — Verification and iPad Notes

## Main Prototype Components

- `web/src/useTranscription.ts` — Web Speech API hook with listening state, interim text, timestamped final lines, and start/stop controls.
- `web/src/useSessionState.ts` — session history and last-choice state persisted in localStorage.
- `web/src/DMConsole.tsx` — human-DM workspace for transcription, AI suggestions, choices, custom actions, private notes, and session reset.
- `web/src/style.css` — console, transcription, choice, error, and input styling.

## Desktop Verification

1. Run `restart.bat` from the project root, or start the backend and frontend separately.
2. Open <http://localhost:5174/#/dm>.
3. Select **Start Listening**, grant microphone permission, and confirm that timestamped speech appears in the transcript. Select **Stop Listening** when finished.
4. Select **Generate Next Scene**. Confirm that an English read-aloud passage, four suggested actions, and private DM notes appear.
5. Select a suggested action and confirm that the next scene is generated.
6. Enter a custom player action and select **Submit and Continue**.
7. Select **Reset Session** and confirm that the story and saved local session state are cleared.
8. Generate several scenes, refresh the page, and confirm that the stored session can continue when it has not been reset.

## iPad Safari Notes

- Speech-recognition behavior varies by iOS version and may require explicit microphone permission. A native transcription implementation could replace the existing hook later.
- Speech recognition normally requires a secure context (HTTPS or localhost). Safari may refuse microphone access when the iPad opens an HTTP address on another computer in the local network.
- The primary DM flow does not depend on WebSocket availability; WebSocket remains available for player-screen synchronization.

## Optional HTTPS Tunnel Test

1. Confirm `cloudflared` is installed. The optional `tools/cloudflared_fix.ps1` helper can repair its PATH entry on Windows.
2. Run `start_all.bat` to start the backend, frontend, and tunnel.
3. Copy the temporary `https://*.trycloudflare.com` URL from the tunnel window and append `/#/dm`.
4. Open that URL on the iPad and grant microphone access when prompted.

Keep the tunnel window open during the test. Do not commit Cloudflare credentials or a local tunnel configuration.

