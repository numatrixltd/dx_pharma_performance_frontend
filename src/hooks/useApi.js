'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * GET helper. Keeps previous data while reloading (no flicker).
 * useApi('/dashboard', { date, outlet }, { enabled: true })
 */
export function useApi(path, params, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([path, params]);

  useEffect(() => {
    if (!enabled || !path) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { params })
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((e) => !cancelled && setState((s) => ({ data: s.data, loading: false, error: e.message })));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
