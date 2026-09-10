import "server-only";
import { appendFileSync, mkdirSync, renameSync, statSync } from "node:fs";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "errors.log");
const LOG_FILE_MAX_SIZE = 5 * 1024 * 1024;

function ensureLogFile() {
  mkdirSync(LOG_DIR, { recursive: true });
  try {
    if (statSync(LOG_FILE).size > LOG_FILE_MAX_SIZE) {
      renameSync(LOG_FILE, path.join(LOG_DIR, "errors.old.log"));
    }
  } catch {
    // file doesn't exist yet — fine
  }
}

export function logError(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const line = `[mti.server] ${context}: ${message}${stack ? "\n" + stack : ""}`;
  const timestamped = `[${new Date().toISOString()}] ${line}`;
  console.error(line);
  if (process.env.VERCEL === "1") return;
  try {
    ensureLogFile();
    appendFileSync(LOG_FILE, timestamped + "\n");
  } catch (writeErr) {
    console.error("[mti.server] log file write failed:", writeErr);
  }
}