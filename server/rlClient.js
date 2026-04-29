import { createConnection } from 'net'
import { extractMessages } from './protocol.js'

const RL_HOST = '127.0.0.1'
const RL_PORT = 49123
const INITIAL_RETRY_MS = 2000
const MAX_RETRY_MS = 30000

let listeners = []
let retryDelay = INITIAL_RETRY_MS
let socket = null
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

  console.log(`[rlClient] Connecting to tcp://${RL_HOST}:${RL_PORT} …`)

  let buffer = ''
  socket = createConnection({ host: RL_HOST, port: RL_PORT })

  socket.on('connect', () => {
    retryDelay = INITIAL_RETRY_MS
    buffer = ''
    console.log('[rlClient] Connected to Rocket League Stats API')
    emit({ Event: '_connected', Data: {} })
  })

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8')
    const { messages, remaining } = extractMessages(buffer)
    buffer = remaining

    for (const raw of messages) {
      try {
        const msg = JSON.parse(raw)
        // The RL Stats API double-encodes Data as a JSON string
        if (typeof msg.Data === 'string') {
          msg.Data = JSON.parse(msg.Data)
        }
        emit(msg)
      } catch {
        console.warn('[rlClient] Failed to parse message:', raw.slice(0, 120))
      }
    }
  })

  socket.on('close', () => {
    if (destroyed) return
    console.log(`[rlClient] Disconnected. Retrying in ${retryDelay}ms …`)
    emit({ Event: '_disconnected', Data: {} })
    setTimeout(connect, retryDelay)
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS)
  })

  socket.on('error', (err) => {
    // ECONNREFUSED is expected when RL isn't running; suppress full stack
    if (err.code !== 'ECONNREFUSED') {
      console.error('[rlClient] TCP error:', err.message)
    }
    // 'close' fires after 'error', triggering reconnect
  })
}

export function start() {
  destroyed = false
  connect()
}

export function stop() {
  destroyed = true
  if (socket) socket.destroy()
}
