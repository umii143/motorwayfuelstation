/**
 * Centralized Logger Abstraction
 * Replaces direct logger.info/warn/error usage.
 * Allows for future integration with monitoring tools (e.g., Sentry, Datadog)
 * and keeps the codebase clean of ESLint no-console warnings.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
 private log(level: LogLevel, message: string, ...args: any[]) {
 // Determine if we should log based on environment.
 // In production, we might want to suppress 'debug' and 'info'.
 const isProduction = typeof process !== 'undefined'
 ? process.env.NODE_ENV === 'production'
 : typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD === true;

 if (isProduction && (level === 'debug' || level === 'info')) {
 return;
 }

 const consoleMethod = console[level] || console.info;
 
 if (args.length > 0) {
 consoleMethod(`[${level.toUpperCase()}] ${message}`, ...args);
 } else {
 consoleMethod(`[${level.toUpperCase()}] ${message}`);
 }

 // Telemetry/error reporting dispatch
 if (level === 'error' && isProduction) {
 this.dispatchTelemetry(message, args);
 }
 }

 private dispatchTelemetry(message: string, args: any[]) {
 // Stub for Sentry / Datadog
 // In a real environment, you would do:
 // Sentry.captureException(new Error(message), { extra: { args } });
 
 // Fallback to a custom backend endpoint if no SDK is loaded
 try {
 fetch('/api/telemetry/error', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 error: message,
 context: args,
 timestamp: new Date().toISOString(),
 url: typeof window !== 'undefined' ? window.location.href : 'server',
 })
 }).catch(() => { /* Silent fail for telemetry */ });
 } catch (e) {
 // Ignore
 }
 }

 info(message: string, ...args: any[]) {
 this.log('info', message, ...args);
 }

 warn(message: string, ...args: any[]) {
 this.log('warn', message, ...args);
 }

 error(message: string, ...args: any[]) {
 this.log('error', message, ...args);
 }

 debug(message: string, ...args: any[]) {
 this.log('debug', message, ...args);
 }
}

export const logger = new Logger();
