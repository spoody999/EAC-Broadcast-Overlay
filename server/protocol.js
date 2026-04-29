/**
 * Shared TCP framing logic for the RL Stats API socket.
 *
 * RL may send newline-delimited JSON, null-byte-delimited JSON, or bare
 * concatenated JSON objects. This handles all three.
 */

export function extractMessages(buffer) {
  const messages = []

  // Strategy 1: newline / CRLF delimited
  if (buffer.includes('\n')) {
    const lines = buffer.split(/\r?\n/)
    const remaining = lines.pop() // last element may be incomplete
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed) messages.push(trimmed)
    }
    return { messages, remaining }
  }

  // Strategy 2: null-byte delimited
  if (buffer.includes('\0')) {
    const parts = buffer.split('\0')
    const remaining = parts.pop()
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed) messages.push(trimmed)
    }
    return { messages, remaining }
  }

  // Strategy 3: extract balanced JSON objects from concatenated stream
  let depth = 0
  let start = -1
  let remaining = buffer
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === '{') {
      if (depth === 0) start = i
      depth++
    } else if (buffer[i] === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        messages.push(buffer.slice(start, i + 1))
        remaining = buffer.slice(i + 1)
        start = -1
      }
    }
  }

  return { messages, remaining }
}
