# EAC Broadcast Overlay

A real-time EAC compatible broadcast overlay for **Rocket League** that connects to Epic Games' new Stats API (introduced alongside the Easy Anti-Cheat update in April 2026). Built as a drop-in replacement for the BakkesMod/SOS plugin workflow used by esports broadcasters and independent streamers.

## Features

- **Live scoreboard** ΓÇö team names, logos, scores, and countdown clock with overtime indicator
- **Per-player boost meters** ΓÇö color-coded by team, with supersonic glow and demolish state
- **Goal notification** ΓÇö animated banner showing scorer, assist, and goal speed; auto-dismisses after 5 seconds
- **Series score** ΓÇö BO3 / BO5 / BO7 win pip display, persisted across game restarts
- **Admin control panel** ΓÇö configure team names, logo URLs, series format, and manually adjust series wins
- **OBS-ready** ΓÇö transparent 1920├ù1080 canvas loaded directly as an OBS Browser Source
- **Dev mock** ΓÇö scripted match sequence for developing without a running copy of Rocket League

## Architecture

```
Rocket League (port 49123)
        Γöé  tcp://127.0.0.1:49123  (newline-delimited JSON)
        Γû╝
  Node.js Relay Server (port 3001)
  Γö£ΓöÇΓöÇ Fans out all RL events to browser clients
  Γö£ΓöÇΓöÇ REST API for series state management
  ΓööΓöÇΓöÇ Persists series config to series.json
        Γöé  ws://127.0.0.1:3001/ws
        Γû╝
  React App (Vite, port 5173)
  Γö£ΓöÇΓöÇ /overlay  ΓåÆ  OBS Browser Source
  ΓööΓöÇΓöÇ /admin    ΓåÆ  Director control panel
```

The relay server pattern is necessary because the RL Stats API accepts only one TCP connection at a time. The relay fans that single connection out to as many browser windows as needed.

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- npm v10 or later (included with Node.js)
- Rocket League installed via Steam or the Epic Games Launcher

## Setup

### 1. Configure Rocket League

Edit `<Rocket League Install Dir>\TAGame\Config\DefaultStatsAPI.ini` before launching the game:

```ini
[TAGame.MatchStatsExporter_TA]

; Port the client will listen for connections on
Port=49123

; How many times per second the game sends the update state (capped at 120, 0 disables)
PacketSendRate=20
```

> **Note:** Changes require a full game restart. `PacketSendRate=0` disables the API entirely.

### 2. Install dependencies

```bash
git clone https://github.com/ryansiegristpa/EAC-Broadcast-Overlay.git
cd EAC-Broadcast-Overlay
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

This starts both the relay server (port 3001) and the Vite dev server (port 5173) concurrently.

### 4. Open the admin panel

Navigate to [http://localhost:5173/admin](http://localhost:5173/admin) in your browser to:

- Set team names and logo URLs
- Choose series format (BO3 / BO5 / BO7)
- Manually adjust series win counts

### 5. Add the overlay to OBS

1. In OBS, add a **Browser Source**
2. Set the URL to `http://localhost:5173/overlay`
3. Set width to **1920** and height to **1080**
4. Enable **"Shutdown source when not visible"** to save resources when off-stream
5. Check **"Refresh browser when scene becomes active"**

The overlay background is fully transparent ΓÇö position it as the top layer in your scene.

## Development Without Rocket League

Run the mock broadcast script in a separate terminal to simulate a full match:

```bash
# Terminal 1 ΓÇö relay server + client
npm run dev

# Terminal 2 ΓÇö mock RL Stats API
node server/mock.js
```

The mock simulates a full match lifecycle: MatchCreated ΓåÆ countdown ΓåÆ two goals (one with an assist) ΓåÆ overtime ΓåÆ final goal ΓåÆ MatchEnded ΓåÆ PodiumStart. Boost values animate so you can verify the boost meters live.

## Production Build

```bash
npm run build       # builds the React client into client/dist/
npm run start       # runs only the relay server (serves no static files)
```

For a production deployment, serve the `client/dist/` folder with any static file server (nginx, Caddy, etc.) and point it at the relay server.

## Project Structure

```
EAC-Broadcast-Overlay/
Γö£ΓöÇΓöÇ package.json              # npm workspaces root + concurrently dev script
Γö£ΓöÇΓöÇ server/
Γöé   Γö£ΓöÇΓöÇ package.json
Γöé   Γö£ΓöÇΓöÇ index.js              # Express + WebSocket relay server + REST API
Γöé   Γö£ΓöÇΓöÇ rlClient.js           # TCP client ΓåÆ RL Stats API (auto-reconnect, newline-delimited JSON)
Γöé   Γö£ΓöÇΓöÇ seriesStore.js        # JSON-backed series state
Γöé   ΓööΓöÇΓöÇ mock.js               # Dev mock ΓÇö scripted match sequence
ΓööΓöÇΓöÇ client/
    Γö£ΓöÇΓöÇ package.json
    Γö£ΓöÇΓöÇ vite.config.js
    Γö£ΓöÇΓöÇ tailwind.config.js
    ΓööΓöÇΓöÇ src/
        Γö£ΓöÇΓöÇ App.jsx
        Γö£ΓöÇΓöÇ main.jsx
        Γö£ΓöÇΓöÇ index.css
        Γö£ΓöÇΓöÇ routes/
        Γöé   Γö£ΓöÇΓöÇ Overlay.jsx   # OBS Browser Source view (1920├ù1080, transparent)
        Γöé   ΓööΓöÇΓöÇ Admin.jsx     # Director control panel
        Γö£ΓöÇΓöÇ components/
        Γöé   Γö£ΓöÇΓöÇ Scoreboard.jsx
        Γöé   Γö£ΓöÇΓöÇ BoostMeters.jsx
        Γöé   Γö£ΓöÇΓöÇ GoalNotification.jsx
        Γöé   ΓööΓöÇΓöÇ SeriesScore.jsx
        Γö£ΓöÇΓöÇ store/
        Γöé   ΓööΓöÇΓöÇ useGameStore.js   # Zustand state
        ΓööΓöÇΓöÇ hooks/
            ΓööΓöÇΓöÇ useStatsSocket.js # WebSocket ΓåÆ store dispatcher
```

## API Reference

The relay server exposes a small REST API for series management:

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | ΓÇö | Returns `{ ok: true, rlConnected: bool }` |
| `GET` | `/api/series` | ΓÇö | Returns current series state |
| `POST` | `/api/series` | `{ teams: [{name, logoUrl}], format }` | Update team config and series format |
| `POST` | `/api/series/increment` | `{ teamNum: 0\|1 }` | Increment a team's series win count |
| `POST` | `/api/series/wins` | `{ teamNum: 0\|1, wins: number }` | Set a team's series wins directly |
| `POST` | `/api/series/reset` | ΓÇö | Reset series wins to 0 for both teams |

## WebSocket Events

The relay forwards all RL Stats API events verbatim, plus a few internal events:

| Event | Source | Description |
|-------|--------|-------------|
| `_init` | Relay | Sent on browser connect; includes current series state and RL connection status |
| `_rlConnected` | Relay | RL Stats API connection established |
| `_rlDisconnected` | Relay | RL Stats API connection lost |
| `_seriesUpdated` | Relay | Series state changed via REST API |
| `UpdateState` | RL | Periodic full game state snapshot |
| `GoalScored` | RL | Goal event with scorer, assist, and ball data |
| `ClockUpdatedSeconds` | RL | Clock tick |
| `CountdownBegin` | RL | Round countdown started |
| `RoundStarted` | RL | Round went active |
| `MatchCreated` | RL | Match initialized |
| `MatchEnded` | RL | Match over |
| `GoalReplayStart/End` | RL | Goal replay lifecycle |
| *(all other RL events)* | RL | Forwarded as-is |

## License

MIT
