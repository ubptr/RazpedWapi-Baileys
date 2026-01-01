import pino from 'pino'

export function createLogger(io) {
  const base = pino({ level: 'info' })

  const normalize = msg => {
    if (typeof msg === 'string') return msg
    try {
      return JSON.stringify(msg)
    } catch {
      return String(msg)
    }
  }

function send(level, msg) {
  if (typeof msg !== 'string') {
    msg = JSON.stringify(msg)
  }

  io.emit('log', { level, msg })
}


  return {
    info:  msg => { base.info(msg);  send('info', msg) },
    warn:  msg => { base.warn(msg);  send('system', msg) },
    error: msg => { base.error(msg); send('error', msg) },
    debug: () => {},
    trace: () => {},
    child: () => createLogger(io)
  }
}
