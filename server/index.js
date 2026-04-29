import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { start as startRLClient, onRLEvent } from './rlClient.js'
import {
  getSeries,
  updateSeriesConfig,
  incrementSeriesWin,
  setSeriesWins,
  resetSeries,
  setMatchGuid,
} from './seriesStore.js'

const PORT = process.env.PORT || 3001

// ─── Express app ────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rlConnected })
})

// Series state
app.get('/api/series', (_req, res) => {
  res.json(getSeries())
})

// Update series config (team names, logos, format)
app.post('/api/series', (req, res) => {
  const { teams, format } = req.body ?? {}
  try {
    const updated = updateSeriesConfig({ teams, format })
    broadcast({ Event: '_seriesUpdated', Data: updated })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Increment a team's series win count
app.post('/api/series/increment', (req, res) => {
  const { teamNum } = req.body ?? {}
  if (teamNum !== 0 && teamNum !== 1) {
    return res.status(400).json({ error: 'teamNum must be 0 or 1' })
  }
  const updated = incrementSeriesWin(teamNum)
  broadcast({ Event: '_seriesUpdated', Data: updated })
  res.json(updated)
})

// Set a team's series win count directly
app.post('/api/series/wins', (req, res) => {
  const { teamNum, wins } = req.body ?? {}
  if (teamNum !== 0 && teamNum !== 1) {
    return res.status(400).json({ error: 'teamNum must be 0 or 1' })
  }
  if (!Number.isInteger(wins) || wins < 0) {
    return res.status(400).json({ error: 'wins must be a non-negative integer' })
  }
  const updated = setSeriesWins(teamNum, wins)
  broadcast({ Event: '_seriesUpdated', Data: updated })
  res.json(updated)
})

// Reset series scores
app.post('/api/series/reset', (_req, res) => {
  const updated = resetSeries()
  broadcast({ Event: '_seriesUpdated', Data: updated })
  res.json(updated)
})

// Manual post-match stats show/hide (Admin → server → all WS clients)
app.post('/api/postmatch/show', (_req, res) => {
  broadcast({ Event: '_postMatchShow', Data: {} })
  res.json({ ok: true })
})

app.post('/api/postmatch/hide', (_req, res) => {
  broadcast({ Event: '_postMatchHide', Data: {} })
  res.json({ ok: true })
})

// ─── HTTP + WebSocket server ─────────────────────────────────────────────────
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

let rlConnected = false
const clients = new Set()

function broadcast(msg) {
  const raw = JSON.stringify(msg)
  for (const client of clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(raw)
    }
  }
}

wss.on('connection', (client) => {
  clients.add(client)
  console.log(`[server] Browser client connected (total: ${clients.size})`)

  // Send current state immediately on connect
  client.send(JSON.stringify({ Event: '_init', Data: { series: getSeries(), rlConnected } }))

  client.on('close', () => {
    clients.delete(client)
    console.log(`[server] Browser client disconnected (total: ${clients.size})`)
  })

  client.on('error', (err) => {
    console.error('[server] Client WS error:', err.message)
    clients.delete(client)
  })
})

// ─── RL event relay ──────────────────────────────────────────────────────────
onRLEvent((msg) => {
  const { Event, Data } = msg

  if (Event === '_connected') {
    rlConnected = true
    broadcast({ Event: '_rlConnected', Data: {} })
    return
  }

  if (Event === '_disconnected') {
    rlConnected = false
    broadcast({ Event: '_rlDisconnected', Data: {} })
    return
  }

  // Track MatchGuid on match creation
  if (Event === 'MatchCreated' && Data?.MatchGuid) {
    setMatchGuid(Data.MatchGuid)
  }

  // Relay all RL events to browser clients
  broadcast(msg)
})

// ─── Start ───────────────────────────────────────────────────────────────────
httpServer.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] Relay server listening on http://127.0.0.1:${PORT}`)
  console.log(`[server] WebSocket relay at ws://127.0.0.1:${PORT}/ws`)
  startRLClient()
})
