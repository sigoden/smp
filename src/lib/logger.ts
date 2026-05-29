import { emit } from "@tauri-apps/api/event";

type LogLevel = "INFO" | "WARN" | "ERROR";

function formatLog(level: LogLevel, message: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level}] [UI] ${message}`;
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(formatLog("INFO", message), ...args);
    emit("log-entry", { level: "INFO", message, timestamp: formatLogTimestamp() });
  },

  warn: (message: string, ...args: unknown[]) => {
    console.warn(formatLog("WARN", message), ...args);
    emit("log-entry", { level: "WARN", message, timestamp: formatLogTimestamp() });
  },

  error: (message: string, ...args: unknown[]) => {
    console.error(formatLog("ERROR", message), ...args);
    emit("log-entry", { level: "ERROR", message, timestamp: formatLogTimestamp() });
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