/**
 * logger.js — Centralised logging utility for Elixir Health Care frontend.
 *
 * WHY THIS EXISTS:
 * Raw console.* calls are scattered across ~33 files. Routing them through
 * this module means production log verbosity can be controlled in one place
 * (e.g. suppressing debug/warn in prod, or forwarding errors to a service
 * like Sentry) without another grep-and-replace sweep.
 *
 * USAGE:
 *   import logger from '@/utils/logger';
 *   logger.error('Something went wrong', err);
 *   logger.warn('Retrying...', { attempt });
 *   logger.debug('Component mounted', props); // silenced in production
 *
 * TO INTEGRATE AN ERROR SERVICE:
 *   Replace the body of logger.error with your SDK call, e.g.:
 *     Sentry.captureException(args[0]);
 *     console.error(...args);
 */

const isDev = import.meta.env.DEV;

const logger = {
  /** Always surfaced — use for caught errors and unexpected failures. */
  error(...args) {
    console.error('[AH]', ...args);
  },

  /** Surfaced in dev only — use for access-control and retry diagnostics. */
  warn(...args) {
    if (isDev) {
      console.warn('[AH]', ...args);
    }
  },

  /** Dev-only — use for tracing data flow, never for errors. */
  debug(...args) {
    if (isDev) {
      console.log('[AH:debug]', ...args);
    }
  },
};

export default logger;
