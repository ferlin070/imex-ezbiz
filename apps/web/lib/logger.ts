const PREFIX = '[MARA]'

function formatArgs(args: unknown[]): string {
  return args.map(a => {
    if (a instanceof Error) return a.stack || a.message
    if (typeof a === 'object') return JSON.stringify(a, null, 0)
    return String(a)
  }).join(' ')
}

export const logger = {
  info: (...args: unknown[]) => console.log(PREFIX, ...args),
  error: (...args: unknown[]) => console.error(PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
  debug: (...args: unknown[]) => {
    if (process.env.LOG_LEVEL === 'debug') console.log(PREFIX, ...args)
  },
}
