interface FlameIconProps {
  size?: number;
  muted?: boolean;
  className?: string;
}

export default function FlameIcon({ size = 14, muted = false, className }: FlameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      style={muted ? { opacity: 0.4 } : undefined}
    >
      {/* Path issu de Lucide « flame » (https://lucide.dev/icons/flame),
          rempli en coral pour s'aligner sur le ton chaud du design system. */}
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill="var(--coral)"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
