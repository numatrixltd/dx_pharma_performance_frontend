// Theme engine. Three colours (accent, background, text) generate every surface, border and text shade.

export const PRESETS = [
    { id: 'arena', name: 'Arena Dark', accent: '#3472d8', background: '#050914', text: '#f8fafc' },
    { id: 'emerald', name: 'Emerald', accent: '#10d98c', background: '#03120c', text: '#ecfdf5' },
    { id: 'violet', name: 'Violet', accent: '#a78bfa', background: '#07061a', text: '#f5f3ff' },
    { id: 'sunset', name: 'Sunset', accent: '#fb923c', background: '#140805', text: '#fff7ed' },
    { id: 'graphite', name: 'Graphite', accent: '#8ab4ff', background: '#0d0f14', text: '#eef2f7' },
    { id: 'daylight', name: 'Daylight', accent: '#0f8f7e', background: '#eef3fb', text: '#0f172a' },
    { id: 'paper', name: 'Paper', accent: '#c2570c', background: '#f7f1e3', text: '#1c1917' },
  ];
  
  export const CORNERS = {
    default: { label: 'Default', scale: 1 },
    sharp: { label: 'Sharp', scale: 0.35 },
    rounded: { label: 'Rounded', scale: 1.45 },
  };
  
  export const DEFAULT_THEME = { preset: 'arena', accent: '#3472d8', background: '#050914', text: '#f8fafc', corners: 'default', autoLight: false };
  
  const HEX = /^#[0-9a-fA-F]{6}$/;
  
  /** Fills gaps and rejects anything that is not a valid hex colour. */
  export function normalizeTheme(t = {}) {
    const ok = (v, d) => (HEX.test(v || '') ? v.toLowerCase() : d);
    return {
      preset: [...PRESETS.map((p) => p.id), 'custom'].includes(t.preset) ? t.preset : DEFAULT_THEME.preset,
      accent: ok(t.accent, DEFAULT_THEME.accent),
      background: ok(t.background, DEFAULT_THEME.background),
      text: ok(t.text, DEFAULT_THEME.text),
      corners: CORNERS[t.corners] ? t.corners : 'default',
      autoLight: Boolean(t.autoLight),
    };
  }
  
  // ---------- colour maths ----------
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  export function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const toVar = (rgb) => rgb.map(clamp).join(' ');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  export function luminance([r, g, b]) {
    const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  export function contrast(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }
  
  const WHITE = [255, 255, 255];
  const BLACK = [0, 0, 0];
  const DARK_LABEL = [11, 16, 32];
  
  /** Contrast numbers shown under the colour pickers. */
  export function contrastReport(theme) {
    const bg = hexToRgb(theme.background);
    const text = hexToRgb(theme.text);
    const accent = hexToRgb(theme.accent);
    const label = contrast(WHITE, accent) >= contrast(DARK_LABEL, accent) ? WHITE : DARK_LABEL;
    return [
      { label: 'Text on background', ratio: contrast(text, bg), min: 4.5 },
      { label: 'Button label on accent', ratio: contrast(label, accent), min: 4.5 },
      { label: 'Accent on background', ratio: contrast(accent, bg), min: 3 },
    ];
  }
  
  /** Returns { vars, mode } where vars are CSS custom properties holding "R G B" triplets. */
  export function buildVars(theme) {
    const bg = hexToRgb(theme.background);
    const text = hexToRgb(theme.text);
    const accent = hexToRgb(theme.accent);
    const light = luminance(bg) > 0.35;
    const v = {};
  
    // Surfaces (ink-950 is the page, 850/800 are cards, 900 inputs, 700/600/500 hovers and borders)
    v['--ink-950'] = toVar(bg);
    if (light) {
      v['--ink-900'] = toVar(mix(bg, WHITE, 0.6));
      v['--ink-850'] = toVar(mix(bg, WHITE, 0.95));
      v['--ink-800'] = toVar(mix(bg, WHITE, 0.88));
      v['--ink-700'] = toVar(mix(bg, text, 0.06));
      v['--ink-600'] = toVar(mix(bg, text, 0.15));
      v['--ink-500'] = toVar(mix(bg, text, 0.26));
    } else {
      const steps = { 900: 0.02, 850: 0.04, 800: 0.065, 700: 0.11, 600: 0.2, 500: 0.32 };
      Object.entries(steps).forEach(([k, t]) => { v[`--ink-${k}`] = toVar(mix(bg, accent, t)); });
    }
  
    // Text shades: from full text colour toward the background
    const fade = { 50: 0, 100: 0.04, 200: 0.1, 300: 0.22, 400: 0.38, 500: 0.52, 600: 0.66, 700: 0.78, 800: 0.88, 900: 0.94 };
    Object.entries(fade).forEach(([k, t]) => { v[`--slate-${k}`] = toVar(mix(text, bg, t)); });
  
    // Accent shades (darker on light themes so accent text stays readable)
    if (light) {
      v['--brand-300'] = toVar(mix(accent, BLACK, 0.35));
      v['--brand-400'] = toVar(mix(accent, BLACK, 0.18));
      v['--brand-600'] = toVar(mix(accent, BLACK, 0.12));
      v['--brand-700'] = toVar(mix(accent, BLACK, 0.3));
    } else {
      v['--brand-300'] = toVar(mix(accent, WHITE, 0.5));
      v['--brand-400'] = toVar(mix(accent, WHITE, 0.25));
      v['--brand-600'] = toVar(mix(accent, BLACK, 0.18));
      v['--brand-700'] = toVar(mix(accent, BLACK, 0.38));
    }
    v['--brand-500'] = toVar(accent);
    v['--c-accent'] = toVar(accent);
    v['--c-text'] = toVar(text);
    v['--c-onaccent'] = toVar(contrast(WHITE, accent) >= contrast(DARK_LABEL, accent) ? WHITE : DARK_LABEL);
    v['--r-scale'] = String((CORNERS[theme.corners] || CORNERS.default).scale);
  
    return { vars: v, mode: light ? 'light' : 'dark' };
  }
  
  export function applyVars(vars, mode) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, val]) => root.style.setProperty(k, val));
    root.setAttribute('data-mode', mode);
  }