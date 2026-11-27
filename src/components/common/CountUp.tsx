import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Valeur affichée, ex. « 8+ », « 20+ », « 100% » ou « 1 200 ». */
  value: string;
  /** Durée de l'animation en millisecondes. */
  duration?: number;
  delay?: number;
  className?: string;
}

/** Découpe « 100% » en préfixe, nombre et suffixe. Renvoie null si la valeur ne contient pas de nombre. */
function parse(value: string) {
  const m = value.match(/^(\D*?)(\d[\d\s  ]*(?:[.,]\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2].replace(/[\s  ]/g, '');
  const decimals = raw.includes(',') || raw.includes('.') ? raw.split(/[.,]/)[1].length : 0;
  const target = parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(target)) return null;
  return { prefix: m[1], target, decimals, comma: raw.includes(','), grouped: /[\s  ]/.test(m[2].trim()), suffix: m[3] };
}

/**
 * Chiffre qui défile de 0 à sa valeur quand il arrive à l'écran (une seule fois).
 * Sans animation si l'utilisateur a demandé à réduire les animations.
 */
export const CountUp: React.FC<CountUpProps> = ({ value, duration = 1800, delay = 0, className }) => {
  const parsed = parse(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;

    setCurrent(0);
    let frame = 0;
    let timer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        timer = window.setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setCurrent(parsed.target * eased);
            if (t < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay]);

  if (!parsed || current === null) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  let num = current.toFixed(parsed.decimals);
  if (parsed.comma) num = num.replace('.', ',');
  if (parsed.grouped) num = num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }} aria-label={value}>
      {parsed.prefix}
      {num}
      {parsed.suffix}
    </span>
  );
};
