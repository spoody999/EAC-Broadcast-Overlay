/**
 * raw-log.js — Dumps every raw byte from the RL Stats API to the console.
 *
 * Run with (stop the Node server first):
 *   node server/raw-log.js
 *
 * Output is written to stdout AND to raw-log.txt in the project root.
 */

import net from 'net'
import fs from 'fs'

const HOST = '127.0.0.1'
const PORT = 49123

const logFile = fs.createWriteStream(new URL('../raw-log.txt', import.meta.url), { flags: 'a' })

function write(line) {
  process.stdout.write(line + '\n')
  logFile.write(line + '\n')
}

write(`\n=== raw-log started ${new Date().toISOString()} ===`)
write(`Connecting to tcp://${HOST}:${PORT} — stop the Node server first\n`)

const socket = net.createConnection({ host: HOST, port: PORT })

socket.on('connect', () => {
  write(`[CONNECTED ${new Date().toISOString()}]\n`)
})

socket.on('data', (chunk) => {
  // Write the raw text exactly as received, no parsing, no trimming
  process.stdout.write(chunk.toString('utf8'))
  logFile.write(chunk.toString('utf8'))
})

socket.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    write('[ERROR] Connection refused — is Rocket League running with Stats API enabled?')
  } else {
    write(`[ERROR] ${err.message}`)
  }
  process.exit(1)
})

socket.on('close', () => {
  write(`\n[CLOSED ${new Date().toISOString()}]`)
  logFile.end()
  process.exit(0)
})
