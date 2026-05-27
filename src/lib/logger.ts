type LogLevel = "INFO" | "WARN" | "ERROR";

function formatLog(level: LogLevel, module: string, message: string): string {
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  return `[${ts}] [${level}] [${module}] ${message}`;
}

export const logger = {
  info: (module: string, message: string, ...args: unknown[]) => {
    console.log(formatLog("INFO", module, message), ...args);
  },

  warn: (module: string, message: string, ...args: unknown[]) => {
    console.warn(formatLog("WARN", module, message), ...args);
  },

  error: (module: string, message: string, ...args: unknown[]) => {
    console.error(formatLog("ERROR", module, message), ...args);
  },
};
