/**
 * watch.js — Logs every raw event RL sends, indefinitely.
 *
 * Run with (Node server stopped first):
 *   node server/watch.js
 *
 * Uses async I/O so RL's game thread is never blocked.
 */

import net from 'net'
import { extractMessages } from './protocol.js'

const HOST = '127.0.0.1'
const PORT = 49123

let buffer = ''

console.log(`[watch] Connecting to tcp://${HOST}:${PORT} — make sure Node server is stopped`)

const socket = net.createConnection({ host: HOST, port: PORT })

socket.on('connect', () => {
  console.log('[watch] Connected. Waiting for events (Ctrl+C to stop)…\n')
})

socket.on('data', (chunk) => {
  buffer += chunk.toString('utf8')
  const { messages, remaining } = extractMessages(buffer)
  buffer = remaining

  for (const raw of messages) {
    try {
      const msg = JSON.parse(raw)
      if (typeof msg.Data === 'string') {
        try { msg.Data = JSON.parse(msg.Data) } catch { /* leave as string */ }
      }
      const eventName = msg.Event ?? '(no Event field)'
      const isGoal = eventName === 'Game:GoalScored'
      const ts = new Date().toISOString()

      if (isGoal) {
        console.log(`\n*** GOAL SCORED *** [${ts}]`)
        console.log(JSON.stringify(msg.Data, null, 2))
        console.log('*******************\n')
      } else if (eventName === 'Game:UpdateState' && msg.Data?.Players) {
        const d = msg.Data
        const playerNames = d.Players.map(p => `${p.Name}(T${p.TeamNum} boost=${p.Boost})`).join(', ')
        console.log(`[${ts}] UpdateState  players=${d.Players.length} [${playerNames}]  score=${d.GameTeams?.[0]?.Score ?? '?'}-${d.GameTeams?.[1]?.Score ?? '?'}  time=${d.GameTimeSeconds ?? '?'}`)
      } else {
        console.log(`[${ts}] ${eventName}`, JSON.stringify(msg.Data ?? '').slice(0, 400))
      }
    } catch {
      console.warn('[watch] parse error on:', raw.slice(0, 120))
    }
  }
})

socket.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error('[watch] Connection refused — is Rocket League running with Stats API enabled?')
  } else {
    console.error('[watch] TCP error:', err.message)
  }
  process.exit(1)
})

socket.on('close', () => {
  console.log('[watch] Connection closed.')
  process.exit(0)
})
