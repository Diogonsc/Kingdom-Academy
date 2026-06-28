import { useCallback, useEffect, useState } from "react";
import { fetchPendingEnrollmentsCount } from "@/services/enrollments";

const POLL_INTERVAL_MS = 60_000;

export function usePendingEnrollmentsCount(enabled = true) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    try {
      const value = await fetchPendingEnrollmentsCount();
      setCount(value);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      setLoading(false);
      return;
    }

    void refetch();

    const interval = window.setInterval(() => {
      void refetch();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [enabled, refetch]);

  return { count, loading, refetch };
}
