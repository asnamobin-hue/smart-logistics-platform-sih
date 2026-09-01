// Lightweight structured logger — no extra dependency needed.
// Swap for Winston/Pino later if you need log shipping to an external service.

const levels = { info: 'INFO', warn: 'WARN', error: 'ERROR' }

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }
  const line = JSON.stringify(entry)
  if (level === levels.error) console.error(line)
  else console.log(line)
}

module.exports = {
  info: (msg, meta) => log(levels.info, msg, meta),
  warn: (msg, meta) => log(levels.warn, msg, meta),
  error: (msg, meta) => log(levels.error, msg, meta)
}