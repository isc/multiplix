interface FlameIconProps {
  size?: number;
  muted?: boolean;
  className?: string;
}

// Définition partagée entre la pill streak (14×14) et la modale streak
// (~56×56). `muted` baisse l'opacité quand la série est interrompue.
export default function FlameIcon({ size = 14, muted = false, className }: FlameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      style={muted ? { opacity: 0.4 } : undefined}
    >
      <path
        d="M8 1c1 2 3 3 3 6 0 1-.5 2-1.5 2.5C10 8 9.5 7 9 6.5c.5 2-.5 3-1 3.5C7 9 6.5 7.5 6.5 7c-1.5 1-2 2-2 3.5C4.5 13 6 15 8 15s3.5-2 3.5-4.5S10 7 8 1z"
        fill="var(--coral)"
        stroke="var(--ink)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
