export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* F avec effet glossy violet */}
        <defs>
          <linearGradient id="fGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
            <stop offset="50%" stopColor="#9333EA" stopOpacity="1" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="fHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Forme du F avec coins arrondis */}
        <path
          d="M 20 15 L 20 85 L 65 85 L 65 70 L 35 70 L 35 50 L 60 50 L 60 35 L 35 35 L 35 15 Z"
          fill="url(#fGradient)"
          filter="url(#glow)"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(168, 85, 247, 0.4))',
          }}
        />
        
        {/* Highlights pour effet glossy */}
        <path
          d="M 25 20 L 25 30 L 30 30 L 30 20 Z"
          fill="url(#fHighlight)"
          opacity="0.8"
        />
        <path
          d="M 25 40 L 25 45 L 55 45 L 55 40 Z"
          fill="url(#fHighlight)"
          opacity="0.6"
        />
      </svg>
    </div>
  )
}

