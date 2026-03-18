import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';

const logDir = 'logs';

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, stack }) => {
          return `${timestamp} [${context || 'Application'}] ${level}: ${message}${stack ? `\n${stack}` : ''}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: `${logDir}/error.log`,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: `${logDir}/combined.log`,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
    }),
  ],
};
