import React, { useState } from 'react';

export default function MaterialThumbnail({ mat, className = '' }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 1. Explicit custom thumbnail_url has top priority
  // 2. If material is an image (mat.type === 'image'), use mat.url as thumbnail
  const imageSource =
    mat?.thumbnail_url || (mat?.type === 'image' && mat?.url ? mat.url : null);

  if (imageSource && !imageError) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-100">
        {!imageLoaded && (
          <div className="absolute inset-0 qh-skeleton-shimmer bg-slate-100 z-0" />
        )}
        <img
          src={imageSource}
          alt={mat?.title || 'Material thumbnail'}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-1 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300 ${className}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none ${className}`}
      style={{
        backgroundColor: '#001e2b',
      }}
    >
      {/* Organic Flowing Curves & Ambient Motif */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 25%, rgba(0, 135, 62, 0.48) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(0, 104, 55, 0.58) 0%, transparent 60%), #001e2b',
        }}
      />

      {/* Stylized Curved Vector Shapes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 group-hover:scale-105 transition-transform duration-700"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 800 800"
      >
        <path
          d="M 150,0 C 320,180 400,120 480,380 C 560,640 680,680 800,800 L 800,0 Z"
          fill="rgba(0, 135, 62, 0.35)"
        />
        <path
          d="M 0,350 C 180,420 280,320 380,580 C 480,780 620,720 800,800 L 0,800 Z"
          fill="rgba(0, 77, 44, 0.4)"
        />
      </svg>


    </div>
  );
}
