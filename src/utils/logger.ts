/**
 * Logger utility that disables console statements in production builds
 * to prevent crashes and performance issues in release mode.
 */

const isDev = __DEV__;

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  error: isDev ? console.error.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  info: isDev ? console.info.bind(console) : () => {},
};
