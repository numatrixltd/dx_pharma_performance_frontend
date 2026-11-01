'use client';
import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Counts up to `value`. `format` turns the running number into a string. */
export default function AnimatedNumber({ value = 0, format = (n) => String(Math.round(n)), duration = 0.9 }) {
  const ref = useRef(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const to = Number(value) || 0;
    if (reduce) { node.textContent = format(to); prev.current = to; return undefined; }
    const controls = animate(prev.current, to, { duration, ease: 'easeOut', onUpdate: (v) => { node.textContent = format(v); } });
    prev.current = to;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return <span ref={ref}>{format(value)}</span>;
}
