import "server-only";

export function logError(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`[mti.server] ${context}: ${message}${stack ? "\n" + stack : ""}`);
}
