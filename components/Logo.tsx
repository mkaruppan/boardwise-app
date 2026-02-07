import React from 'react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shield Base */}
    <path d="M50 5L90 25V55C90 80 75 105 50 115C25 105 10 80 10 55V25L50 5Z" fill="url(#grad_shield)" stroke="#38bdf8" strokeWidth="3"/>
    
    {/* Letter B */}
    <path d="M38 35H55C62 35 65 38 65 45C65 50 62 53 58 54C63 55 66 59 66 65C66 72 62 75 55 75H38V35Z" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M38 54H58" stroke="white" strokeWidth="4" strokeLinecap="round"/>

    {/* Arrow Up (Growth) */}
    <path d="M30 90L60 60" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round"/>
    <path d="M60 60H45" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M60 60V75" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>

    {/* Decorative Gear Bit */}
    <circle cx="32" cy="72" r="6" stroke="#94a3b8" strokeWidth="2" strokeDasharray="2 2" />

    <defs>
      <linearGradient id="grad_shield" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#1e293b', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#0f172a', stopOpacity:1}} />
      </linearGradient>
    </defs>
  </svg>
);

export default Logo;