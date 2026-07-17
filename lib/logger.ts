import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    },
  },
})

function wrapMethod(methodName: 'info' | 'error' | 'warn' | 'debug') {
  return (arg1: any, arg2?: any, ...args: any[]) => {
    const logFn = pinoLogger[methodName] as any
    if (typeof arg1 === 'string') {
      if (arg2 !== undefined) {
        // Swap arguments: pino expects (object, message)
        if (arg2 instanceof Error) {
          logFn({ err: arg2 }, arg1, ...args)
        } else if (typeof arg2 === 'object') {
          logFn(arg2, arg1, ...args)
        } else {
          logFn({}, `${arg1} %o`, arg2, ...args)
        }
      } else {
        logFn(arg1, ...args)
      }
    } else {
      logFn(arg1, arg2, ...args)
    }
  }
}

type LogMethod = {
  (msg: string, ...args: any[]): void;
  (obj: object, msg?: string, ...args: any[]): void;
}

export const logger = {
  info: wrapMethod('info') as LogMethod,
  error: wrapMethod('error') as LogMethod,
  warn: wrapMethod('warn') as LogMethod,
  debug: wrapMethod('debug') as LogMethod,
}
