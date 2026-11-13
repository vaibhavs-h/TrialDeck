import { useInvoke } from './useInvoke.js';

export function useDashboard() {
  return useInvoke('getDashboard');
}
