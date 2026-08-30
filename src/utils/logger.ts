import winston from "winston";
import logfmt from "logfmt";
import config from "config";

type LogConfig = {
  level: "debug" | "info" | "warn" | "error"
  filename?: string
  max_size_bytes?: number
  max_files?: number
}
const logConfig = config.get<LogConfig>("log")

const loggerFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return logfmt.stringify({time: timestamp, level, msg: message, ...meta})
})

const loggerTransports: winston.transport[] = []
loggerTransports.push(new winston.transports.Console())
if (logConfig.filename) {
  loggerTransports.push(new winston.transports.File({
    filename: logConfig.filename,
    maxsize: logConfig.max_size_bytes ?? 1048576,
    maxFiles: logConfig.max_files ?? 3
  }))
}

export const logger = winston.createLogger({
  level: logConfig.level,
  format: winston.format.combine(winston.format.timestamp(), loggerFormat),
  transports: loggerTransports
})
