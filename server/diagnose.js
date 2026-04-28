/**
 * diagnose.js — Raw diagnostic tool for the Rocket League Stats API socket.
 *
 * Run with:  node server/diagnose.js
 *
 * This script connects to port 49123, logs EVERYTHING it receives as both
 * UTF-8 text and hex, and after 2 seconds tries sending an HTTP upgrade
 * request to test if the server is a WebSocket server. Use this to
 * determine the exact protocol RL uses.
 */

import net from 'net'

const HOST = '127.0.0.1'
const PORT = 49123

console.log(`[diagnose] Connecting to tcp://${HOST}:${PORT} …`)

const socket = net.createConnection({ host: HOST, port: PORT })
let bytesReceived = 0
let sentUpgrade = false

socket.on('connect', () => {
  console.log('[diagnose] TCP connection established.')
  console.log('[diagnose] Waiting 2s for spontaneous data (raw TCP server would send immediately)…\n')

  setTimeout(() => {
    if (bytesReceived === 0 && !sentUpgrade) {
      sentUpgrade = true
      console.log('\n[diagnose] No spontaneous data received.')
      console.log('[diagnose] Sending HTTP WebSocket upgrade request to test if server is WS…\n')
      const upgradeRequest = [
        `GET / HTTP/1.1`,
        `Host: ${HOST}:${PORT}`,
        `Upgrade: websocket`,
        `Connection: Upgrade`,
        `Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==`,
        `Sec-WebSocket-Version: 13`,
        ``,
        ``,
      ].join('\r\n')
      socket.write(upgradeRequest)
    } else if (bytesReceived > 0) {
      console.log(`\n[diagnose] Received ${bytesReceived} bytes spontaneously — this is a raw TCP server.`)
    }
  }, 2000)
})

socket.on('data', (chunk) => {
  bytesReceived += chunk.length
  const text = chunk.toString('utf8')
  const hex = chunk.toString('hex').replace(/(.{2})/g, '$1 ').replace(/(.{48})/g, '$1\n           ')

  console.log(`\n[diagnose] ← Received ${chunk.length} bytes:`)
  console.log('  UTF-8:', JSON.stringify(text.slice(0, 300)) + (text.length > 300 ? '…' : ''))
  console.log('  HEX  :', hex)

  // Try to detect what protocol is being used
  if (!sentUpgrade) {
    console.log('\n[diagnose] VERDICT: Server sent data before we sent anything → raw TCP stream')
  } else if (text.startsWith('HTTP/1.1 101') || text.startsWith('HTTP/1.0 101')) {
    console.log('\n[diagnose] VERDICT: Server sent HTTP 101 Switching Protocols → WebSocket confirmed')
  } else if (text.startsWith('HTTP/')) {
    console.log('\n[diagnose] VERDICT: Server sent HTTP response (not 101) →', text.split('\r\n')[0])
  } else if (text.trim().startsWith('{')) {
    console.log('\n[diagnose] VERDICT: Server sent raw JSON after our upgrade request → raw TCP, ignores handshake')
  } else {
    console.log('\n[diagnose] VERDICT: Unknown protocol — inspect hex above')
  }
})

socket.on('error', (err) => {
  console.error(`\n[diagnose] TCP error: ${err.message}`)
  if (err.code === 'ECONNREFUSED') {
    console.error('[diagnose] Port 49123 is not open. Make sure Rocket League is running')
    console.error('           and DefaultStatsAPI.ini has PacketSendRate > 0.')
  }
})

socket.on('close', () => {
  console.log(`\n[diagnose] Connection closed. Total bytes received: ${bytesReceived}`)
  process.exit(0)
})

// Auto-exit after 15 seconds
setTimeout(() => {
  console.log('\n[diagnose] Timeout — closing.')
  socket.destroy()
}, 15000)
