import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'bot.log');
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] [${level}]`;
    const formattedMessage = [prefix, message, ...args].map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ');
    
    // Log to console
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }

    // Log to file
    try {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = new Logger();
