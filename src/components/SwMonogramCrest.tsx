interface SwMonogramCrestProps {
  className?: string;
}

export function SwMonogramCrest({ className = 'w-8 h-8' }: SwMonogramCrestProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18.25" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="20" cy="20" r="15.25" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.55" />
      {/* Subtle botanical longleaf sprigs flanking crest */}
      <path
        d="M8.5 24.5C7 21.5 7.2 17.5 9.2 14.5M8.5 24.5C9.5 22 10 19.5 9.8 17"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M31.5 24.5C33 21.5 32.8 17.5 30.8 14.5M31.5 24.5C30.5 22 30 19.5 30.2 17"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fill="currentColor"
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        SW
      </text>
    </svg>
  );
}
