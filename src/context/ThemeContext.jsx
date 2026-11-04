'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_THEME, PRESETS, applyVars, buildVars, normalizeTheme } from '@/lib/theme';

const ThemeContext = createContext(null);
const CACHE_KEY = 'dxa_theme_cache';

/** Everything the page needs to paint instantly next time (used by the inline script in layout.jsx). */
function computeAll(theme) {
  const main = buildVars(theme);
  const dl = PRESETS.find((p) => p.id === 'daylight');
  const light = buildVars({ ...theme, accent: dl.accent, background: dl.background, text: dl.text });
  return { vars: main.vars, mode: main.mode, lightVars: light.vars, lightMode: light.mode, autoLight: !!theme.autoLight };
}

export function ThemeProvider({ children }) {
  const [saved, setSaved] = useState(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);
  const preview = useRef(null);
  const savedRef = useRef(saved);
  savedRef.current = saved;

  /** isPreview ignores the "switch to Daylight on light devices" option so admins see exactly what they edit. */
  const paint = useCallback((theme, isPreview = false) => {
    const c = computeAll(theme);
    const useLight = !isPreview && c.autoLight && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyVars(useLight ? c.lightVars : c.vars, useLight ? c.lightMode : c.mode);
  }, []);

  const cache = (theme) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(computeAll(theme))); } catch { /* storage unavailable */ } };

  useEffect(() => {
    let on = true;
    api('/theme')
      .then((t) => {
        if (!on) return;
        const th = normalizeTheme(t);
        setSaved(th);
        cache(th);
        if (!preview.current) paint(th);
      })
      .catch(() => { if (on && !preview.current) paint(savedRef.current); })
      .finally(() => on && setLoaded(true));
    return () => { on = false; };
  }, [paint]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const h = () => { if (!preview.current) paint(savedRef.current); };
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [paint]);

  /** applyPreview(theme) shows an unsaved theme live. applyPreview(null) goes back to the saved one. */
  const applyPreview = useCallback((theme) => {
    preview.current = theme;
    paint(theme || savedRef.current, !!theme);
  }, [paint]);

  const save = useCallback(async (theme) => {
    const t = normalizeTheme(await api('/theme', { method: 'PUT', body: theme }));
    setSaved(t);
    cache(t);
    preview.current = null;
    paint(t);
    return t;
  }, [paint]);

  const value = useMemo(() => ({ saved, loaded, applyPreview, save }), [saved, loaded, applyPreview, save]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);