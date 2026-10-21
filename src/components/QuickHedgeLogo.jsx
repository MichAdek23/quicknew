import React from 'react';

export default function QuickHedgeLogo({
  height = 36,
  color = 'currentColor',
  accentColor = '#00873E',
  withAccent = false,
  className = '',
  style = {},
}) {
  // Aspect ratio is 340 / 64 ≈ 5.3125
  const width = Math.round(height * 5.3125);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 64"
      height={height}
      width={width}
      className={className}
      style={{ display: 'block', ...style }}
      aria-label="QuickHedge"
      role="img"
    >
      {/* Wordmark: QuickHedge in Bold Geometric Grotesque Sans */}
      <text
        x="0"
        y="47"
        fill={color}
        fontFamily="'NeueHaas', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontSize="44"
        fontWeight="900"
        letterSpacing="-1.5"
      >
        QuickHedge
      </text>

      {/* Geometric Double Chevron Emblem (Matching Reference Guide) */}
      <g transform="translate(268, 4) scale(0.95)" fill={withAccent ? accentColor : color}>
        {/* Top Chevron */}
        <path d="M 32 4 L 58 30 L 48 40 L 32 24 L 16 40 L 6 30 Z" />
        {/* Bottom Chevron */}
        <path d="M 32 26 L 58 52 L 48 62 L 32 46 L 16 62 L 6 52 Z" />
      </g>
    </svg>
  );
}
