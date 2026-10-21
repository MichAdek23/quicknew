import React from 'react';

export default function MaterialCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden flex flex-col shadow-xs select-none">
      {/* Thumbnail Skeleton: matching double height h-[352px] */}
      <div className="relative h-[352px] w-full qh-skeleton-shimmer bg-slate-100 border-b border-gray-100" />

      {/* Card Body Skeleton */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Date skeleton pill */}
          <div className="w-24 h-2.5 qh-skeleton-shimmer bg-slate-200 rounded-full mb-3.5" />

          {/* Title skeleton lines */}
          <div className="w-4/5 h-4 qh-skeleton-shimmer bg-slate-200 rounded-md mb-2" />
          <div className="w-3/5 h-4 qh-skeleton-shimmer bg-slate-200 rounded-md mb-4" />

          {/* Description skeleton lines */}
          <div className="w-full h-2.5 qh-skeleton-shimmer bg-slate-100 rounded-md mb-2" />
          <div className="w-11/12 h-2.5 qh-skeleton-shimmer bg-slate-100 rounded-md mb-2" />
          <div className="w-2/3 h-2.5 qh-skeleton-shimmer bg-slate-100 rounded-md" />
        </div>
      </div>
    </div>
  );
}
