type Props = {
  className?: string;
};

export function AboMark({ className }: Props) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none">
        <g fill="none" stroke="currentColor" strokeLinejoin="round">
          <circle cx="50" cy="50" r="37" strokeWidth="6" />
          <path d="M50 16v68" strokeWidth="5.4" strokeLinecap="butt" />
          <path d="M26.55 74.62 50 16" strokeWidth="5.4" strokeLinecap="butt" />
          <path d="M33 52H50" strokeWidth="5.4" strokeLinecap="butt" />
          <path d="M50 26a13 13 0 0 1 0 26 16 16 0 0 1 0 32" strokeWidth="5.4" strokeLinecap="butt" />
        </g>
      </svg>
    </span>
  );
}
