import { useCallback } from 'react';

const CONFETTI_COLORS = [
  '#6C63FF', // purple (primary)
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#FFE66D', // yellow
  '#FF8A5C', // orange
  '#A8E6CF', // mint
  '#F8B500', // gold
];

const PARTICLE_COUNT = 40;
const ANIMATION_DURATION_MS = 2000;

export function useConfetti() {
  const triggerConfetti = useCallback(() => {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    document.body.appendChild(container);

    // Inject keyframes if not already present
    const styleId = 'multiplix-confetti-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes multiplix-confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg) scale(1);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = document.createElement('div');
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size = 6 + Math.random() * 8;
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 1.2 + Math.random() * 1;
      const isCircle = Math.random() > 0.5;

      particle.style.cssText = `
        position: absolute;
        top: -10px;
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: ${isCircle ? '50%' : '2px'};
        animation: multiplix-confetti-fall ${duration}s ease-in ${delay}s forwards;
      `;

      container.appendChild(particle);
    }

    // Clean up after animation completes
    setTimeout(() => {
      container.remove();
    }, ANIMATION_DURATION_MS);
  }, []);

  return { triggerConfetti };
}
