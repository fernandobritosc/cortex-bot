import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'bot.log');
const ERROR_FILE = path.join(process.cwd(), 'error.log');

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

class Logger {
  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}\n`;
  }

  private writeToFile(file: string, content: string) {
    fs.appendFileSync(file, content);
  }

  info(message: string, ...args: any[]) {
    const content = this.formatMessage(LogLevel.INFO, message, ...args);
    console.log(content.trim());
    this.writeToFile(LOG_FILE, content);
  }

  warn(message: string, ...args: any[]) {
    const content = this.formatMessage(LogLevel.WARN, message, ...args);
    console.warn(content.trim());
    this.writeToFile(LOG_FILE, content);
  }

  error(message: string, error?: any, ...args: any[]) {
    const errorMsg = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
    const content = this.formatMessage(LogLevel.ERROR, `${message} | Error: ${errorMsg}`, ...args);
    console.error(content.trim());
    this.writeToFile(LOG_FILE, content);
    this.writeToFile(ERROR_FILE, content);
  }

  debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      const content = this.formatMessage(LogLevel.DEBUG, message, ...args);
      console.debug(content.trim());
      this.writeToFile(LOG_FILE, content);
    }
  }
}

export const logger = new Logger();
