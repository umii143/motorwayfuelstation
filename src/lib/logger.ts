/**
import { logger } from '../lib/logger';
 * Centralized Logger Abstraction
 * Replaces direct logger.info/warn/error usage.
 * Allows for future integration with monitoring tools (e.g., Sentry, Datadog)
 * and keeps the codebase clean of ESLint no-console warnings.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, ...args: unknown[]) {
    // Determine if we should log based on environment.
    // In production, we might want to suppress 'debug' and 'info'.
    const isProduction = import.meta.env?.PROD || false;

    if (isProduction && (level === 'debug' || level === 'info')) {
      return;
    }

    const consoleMethod = console[level] || logger.info;
    
    if (args.length > 0) {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, ...args);
    } else {
      consoleMethod(`[${level.toUpperCase()}] ${message}`);
    }

    // Future: Add telemetry/error reporting dispatch here
    if (level === 'error' && isProduction) {
      // e.g., Sentry.captureException(args[0] || message);
    }
  }

  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args);
  }

  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args);
  }
}

export const logger = new Logger();
