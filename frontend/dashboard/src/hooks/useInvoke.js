import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';

/**
 * Universal invoke hook wrapping @forge/bridge invoke with loading, error, and refetch support.
 */
export function useInvoke(functionName, payload = undefined) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    invoke(functionName, payload)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`Error invoking ${functionName}:`, err);
          setError(String(err?.message || err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [functionName, JSON.stringify(payload)]);

  useEffect(() => {
    return execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

