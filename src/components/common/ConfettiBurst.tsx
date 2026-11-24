import React, { useMemo } from 'react';

const COLORS = ['#1C2B4A', '#B8975A', '#0F1A30', '#25D366', '#E9D9B4', '#1F1F1F'];

interface ConfettiBurstProps {
  count?: number;
}

/**
 * Petite animation confetti en CSS pur, déclenchée une fois au montage.
 * Pensée pour être posée à l'intérieur d'un conteneur positionné en
 * `relative` (et idéalement `overflow-hidden`) afin que les confettis
 * restent visuellement contenus dans ce bloc plutôt que sur tout l'écran.
 */
export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ count = 70 }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const size = 5 + Math.random() * 6;
        return {
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.35,
          duration: 2 + Math.random() * 1.3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          width: size,
          height: size * (0.4 + Math.random() * 0.5),
          rotate: Math.random() * 360,
          drift: Math.round((Math.random() - 0.5) * 140),
          rounded: Math.random() > 0.5,
        };
      }),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: 'absolute',
              left: `${p.left}%`,
              top: '-12px',
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              borderRadius: p.rounded ? '9999px' : '2px',
              opacity: 0.9,
              animation: `confetti-fall-${p.id % 5} ${p.duration}s ${p.delay}s ease-in forwards`,
              transform: `rotate(${p.rotate}deg)`,
              ['--confetti-drift' as any]: `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes confetti-fall-0 { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--confetti-drift), 380px) rotate(540deg); opacity: 0; } }
        @keyframes confetti-fall-1 { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--confetti-drift), 420px) rotate(-620deg); opacity: 0; } }
        @keyframes confetti-fall-2 { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--confetti-drift), 400px) rotate(700deg); opacity: 0; } }
        @keyframes confetti-fall-3 { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--confetti-drift), 360px) rotate(-480deg); opacity: 0; } }
        @keyframes confetti-fall-4 { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--confetti-drift), 440px) rotate(600deg); opacity: 0; } }
      `}</style>
    </div>
  );
};
