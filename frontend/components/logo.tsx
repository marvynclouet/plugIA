'use client'

import { useId } from 'react'

export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  const id = useId()
  const gradientId = `fGradient-${id}`
  const highlightId = `fHighlight-${id}`
  const reflectId = `fReflect-${id}`
  const glowId = `glow-${id}`

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Gradient principal violet glossy */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="1" />
            <stop offset="30%" stopColor="#A855F7" stopOpacity="1" />
            <stop offset="60%" stopColor="#9333EA" stopOpacity="1" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
          </linearGradient>
          
          {/* Highlight pour effet glossy */}
          <linearGradient id={highlightId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F3E8FF" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#E9D5FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.2" />
          </linearGradient>
          
          {/* Gradient pour les reflets internes */}
          <linearGradient id={reflectId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F3E8FF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#C084FC" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Forme du F avec coins très arrondis (effet blob/liquid) */}
        <path
          d="M 18 12 
             C 18 12, 18 15, 18 20
             L 18 80
             C 18 85, 20 88, 25 88
             L 60 88
             C 65 88, 68 86, 68 81
             L 68 72
             C 68 67, 66 65, 61 65
             L 38 65
             L 38 55
             L 63 55
             C 68 55, 70 53, 70 48
             L 70 38
             C 70 33, 68 31, 63 31
             L 38 31
             L 38 20
             C 38 15, 36 12, 31 12
             Z"
          fill={`url(#${gradientId})`}
          filter={`url(#${glowId})`}
          style={{
            filter: 'drop-shadow(0 6px 20px rgba(168, 85, 247, 0.5))',
          }}
        />
        
        {/* Reflets glossy en haut */}
        <path
          d="M 25 18 
             C 25 18, 25 22, 25 26
             L 30 26
             C 30 22, 30 18, 25 18
             Z"
          fill={`url(#${highlightId})`}
          opacity="0.9"
        />
        
        {/* Reflet glossy sur la barre horizontale du haut */}
        <path
          d="M 30 38 
             L 65 38
             L 65 42
             L 30 42
             Z"
          fill={`url(#${reflectId})`}
          opacity="0.7"
        />
        
        {/* Reflet glossy sur la barre horizontale du milieu */}
        <path
          d="M 30 52 
             L 60 52
             L 60 56
             L 30 56
             Z"
          fill={`url(#${reflectId})`}
          opacity="0.6"
        />
        
        {/* Lignes/swirls internes pour effet liquid */}
        <path
          d="M 22 25 
             Q 28 22, 32 25
             Q 28 28, 22 25"
          fill="none"
          stroke="#E9D5FF"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />
      </svg>
    </div>
  )
}

