import { WebSocket } from 'ws'

const RL_WS_URL = 'ws://127.0.0.1:49123'
const INITIAL_RETRY_MS = 2000
const MAX_RETRY_MS = 30000

let listeners = []
let retryDelay = INITIAL_RETRY_MS
let ws = null
let destroyed = false

export function onRLEvent(fn) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

function emit(message) {
  for (const fn of listeners) {
    try {
      fn(message)
    } catch (err) {
      console.error('[rlClient] listener error:', err)
    }
  }
}

function connect() {
  if (destroyed) return

  console.log(`[rlClient] Connecting to ${RL_WS_URL} …`)
  ws = new WebSocket(RL_WS_URL)

  ws.on('open', () => {
    retryDelay = INITIAL_RETRY_MS
    console.log('[rlClient] Connected to Rocket League Stats API')
    emit({ Event: '_connected', Data: {} })
  })

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      emit(msg)
    } catch (err) {
      console.warn('[rlClient] Failed to parse message:', raw.toString())
    }
  })

  ws.on('close', () => {
    if (destroyed) return
    console.log(`[rlClient] Disconnected. Retrying in ${retryDelay}ms …`)
    emit({ Event: '_disconnected', Data: {} })
    setTimeout(connect, retryDelay)
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS)
  })

  ws.on('error', (err) => {
    // Connection refused is expected when RL isn't running; suppress full stack
    if (err.code !== 'ECONNREFUSED') {
      console.error('[rlClient] WebSocket error:', err.message)
    }
    // 'close' will fire after 'error', triggering reconnect
  })
}

export function start() {
  destroyed = false
  connect()
}

export function stop() {
  destroyed = true
  if (ws) ws.close()
}
