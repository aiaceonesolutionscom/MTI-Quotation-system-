"use client";

import { useEffect, useState } from "react";

export const EXPIRY_TICK_INTERVAL_MS = 60_000;

/** Returns a fresh `now` that re-renders the component every interval so live statuses stay accurate. */
export function useExpiryTick(intervalMs: number = EXPIRY_TICK_INTERVAL_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}