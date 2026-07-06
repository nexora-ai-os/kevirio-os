export default function BrandMark({ size = 48 }) {
  return (
    <div className="brand-mark" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" role="img" aria-label="KEVIRIO logo">
        <defs>
          <linearGradient id="kevirioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#65D28A" />
            <stop offset="48%" stopColor="#B7F4E2" />
            <stop offset="100%" stopColor="#57B8FF" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="42" fill="rgba(255,255,255,0.72)" stroke="rgba(101,210,138,0.28)" strokeWidth="2" />
        <path d="M31 24 C50 21 72 33 72 55 C72 73 57 84 41 78 C29 73 24 60 29 49 C36 34 54 38 59 49 C63 58 57 66 48 65" fill="none" stroke="url(#kevirioGradient)" strokeWidth="8" strokeLinecap="round" filter="url(#softGlow)" />
        <path d="M36 67 C47 54 57 43 69 29" fill="none" stroke="#2D3137" strokeWidth="5" strokeLinecap="round" opacity="0.78" />
      </svg>
    </div>
  );
}
