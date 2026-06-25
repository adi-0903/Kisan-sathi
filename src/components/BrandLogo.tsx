import React from 'react';
import { motion } from 'motion/react';

export function BrandLogo({ size = 120, className = "" }: { size?: number, className?: string }) {
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <svg 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#065F46" />
            <stop offset="1" stopColor="#022C22" />
          </linearGradient>
          
          <linearGradient id="sunGrad" x1="60" y1="10" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
          
          <linearGradient id="leafLeft" x1="20" y1="40" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="leafRight" x1="100" y1="30" x2="50" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6EE7B7" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Modern Custom Squircle Background */}
        <rect width="120" height="120" rx="34" fill="url(#bgGrad)" />

        {/* Glowing Ambient Sun */}
        <circle cx="60" cy="48" r="26" fill="url(#sunGrad)" filter="url(#softGlow)" />
        
        {/* Subtle abstract ground arches */}
        <path d="M 10 90 Q 60 75 110 90" stroke="#10B981" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <path d="M 20 102 Q 60 90 100 102" stroke="#047857" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

        {/* Right overlapping elegant leaf */}
        <path 
          d="M60 100 C 60 100, 110 75, 88 28 C 88 28, 55 55, 60 100 Z" 
          fill="url(#leafRight)"
        />

        {/* Left overlapping elegant leaf */}
        <path 
          d="M60 100 C 60 100, 20 80, 32 38 C 32 38, 55 65, 60 100 Z" 
          fill="url(#leafLeft)"
        />

        {/* Center structural stem / tech integration node */}
        <path 
          d="M60 100 L60 62" 
          stroke="#022C22" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
        <circle cx="60" cy="58" r="6" fill="#34D399" stroke="#022C22" strokeWidth="2.5" />
        <circle cx="60" cy="58" r="2" fill="#FFFFFF" />

        {/* Digital Growth Sparkles */}
        <circle cx="85" cy="22" r="3" fill="#FDE047" filter="url(#softGlow)" />
        <path d="M85 15 L85 29 M78 22 L92 22" stroke="#FDE047" strokeWidth="1.5" opacity="0.8" />
        
        <circle cx="36" cy="28" r="2.5" fill="#6EE7B7" filter="url(#softGlow)" />
        <path d="M36 23 L36 33 M31 28 L41 28" stroke="#6EE7B7" strokeWidth="1" opacity="0.6" />

      </svg>
    </motion.div>
  );
}
