import { emit } from "@tauri-apps/api/event";

type LogLevel = "INFO" | "WARN" | "ERROR";

function formatLog(level: LogLevel, module: string, message: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level}] [${module}] ${message}`;
}

export const logger = {
  info: (module: string, message: string, ...args: unknown[]) => {
    console.log(formatLog("INFO", module, message), ...args);
    emit("log-entry", { level: "INFO", module, message, timestamp: formatLogTimestamp() });
  },

  warn: (module: string, message: string, ...args: unknown[]) => {
    console.warn(formatLog("WARN", module, message), ...args);
    emit("log-entry", { level: "WARN", module, message, timestamp: formatLogTimestamp() });
  },

  error: (module: string, message: string, ...args: unknown[]) => {
    console.error(formatLog("ERROR", module, message), ...args);
    emit("log-entry", { level: "ERROR", module, message, timestamp: formatLogTimestamp() });
  },
};

function formatLogTimestamp(date = new Date()) {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);

  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const offsetH = pad(Math.floor(absMin / 60));
  const offsetM = pad(absMin % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${offsetH}:${offsetM}`;
}