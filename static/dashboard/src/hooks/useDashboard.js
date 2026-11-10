import { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

/** Loads dashboard data from the backend resolver; exposes loading/error states. */
export function useDashboard() {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    invoke('getDashboard')
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: String(e) }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
