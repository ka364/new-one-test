/**
 * Structured Logging System
 * Production-ready logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName = 'haderos-api', environment = process.env.NODE_ENV || 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      service: this.serviceName,
      environment: this.environment,
      ...entry,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    const minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

    return levels.indexOf(level) >= levels.indexOf(minLevel);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.stack = error.stack;
    }

    const formatted = this.formatLog(entry);

    // In production, send to logging service (e.g., Datadog, Papertrail)
    // For now, just console log with colors
    switch (level) {
      case 'debug':
        console.debug('\x1b[36m%s\x1b[0m', formatted); // Cyan
        break;
      case 'info':
        console.info('\x1b[32m%s\x1b[0m', formatted); // Green
        break;
      case 'warn':
        console.warn('\x1b[33m%s\x1b[0m', formatted); // Yellow
        break;
      case 'error':
        console.error('\x1b[31m%s\x1b[0m', formatted); // Red
        break;
      case 'critical':
        console.error('\x1b[35m%s\x1b[0m', formatted); // Magenta
        // In production, trigger alerts (PagerDuty, Slack, etc.)
        break;
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    this.log('critical', message, context, error);
  }

  // Request logging middleware
  requestLogger() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;

        this.info('HTTP Request', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      });

      next();
    };
  }
}

export const logger = new Logger();
export default logger;
