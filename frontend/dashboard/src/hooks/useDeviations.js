import { useInvoke } from './useInvoke.js';
import { invoke } from '@forge/bridge';
import { useState } from 'react';

export function useDeviations(site = null, days = 90, category = 'all') {
  return useInvoke('getDeviations', { site, days, category });
}

export function useDeviation(issueKey) {
  return useInvoke('getDeviation', { issueKey });
}

export function useSites() {
  return useInvoke('getSites');
}

export function useCapas() {
  return useInvoke('getCapas');
}

export function useSiteTasks(site = null) {
  return useInvoke('getSiteTasks', { site });
}

export function useReports() {
  return useInvoke('getReports');
}

export function useCreateMeta() {
  return useInvoke('getCreateMeta');
}

export function useSettings() {
  return useInvoke('getSettings');
}

/**
 * Mutation helper providing stateful execution for writes
 */
export function useMutation(functionName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [data, setData] = useState(null);

  const mutate = async (payload) => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    try {
      const res = await invoke(functionName, payload);
      setData(res);
      setLoading(false);
      return res;
    } catch (err) {
      const msg = String(err?.message || err);
      setError(msg);
      setErrorDetails(err?.details || null);
      setLoading(false);
      throw err;
    }
  };

  return {
    mutate,
    loading,
    error,
    errorDetails,
    data,
    reset: () => { setError(null); setErrorDetails(null); setData(null); }
  };
}
