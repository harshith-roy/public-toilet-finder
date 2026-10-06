import React from 'react'
import type { Toilet } from '../../types'
import {
  formatDistance,
  getCleanlinessBadge,
  getOperationalBadge,
} from '../../utils/toiletFormatters'

interface ToiletCardProps {
  toilet: Toilet
  isSelected: boolean
  onSelect: (toilet: Toilet) => void
  onNavigate: (toilet: Toilet, e: React.MouseEvent) => void
}

export const ToiletCard: React.FC<ToiletCardProps> = ({
  toilet,
  isSelected,
  onSelect,
  onNavigate,
}) => {
  const cleanBadge = getCleanlinessBadge(toilet.cleanliness_status)
  const operBadge = getOperationalBadge(toilet.operational_status)

  return (
    <div
      onClick={() => onSelect(toilet)}
      className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
        isSelected
          ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <h3 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-1">
          {toilet.name}
        </h3>
        <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
          {formatDistance(toilet.distance_km)}
        </span>
      </div>

      {toilet.address && (
        <p className="text-xs text-slate-500 line-clamp-1 mb-2.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{toilet.address}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cleanBadge.bg}`}>
          {cleanBadge.label}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${operBadge.bg}`}>
          {operBadge.label}
        </span>
        <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          {toilet.source_type || 'Government / ULB'}
        </span>
      </div>

      {toilet.facilities && toilet.facilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {toilet.facilities.slice(0, 3).map((facility, i) => (
            <span
              key={i}
              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
            >
              {facility}
            </span>
          ))}
          {toilet.facilities.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{toilet.facilities.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-emerald-700 font-medium hover:underline inline-flex items-center gap-1">
          View details
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <button
          type="button"
          onClick={(e) => onNavigate(toilet, e)}
          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Navigate
        </button>
      </div>
    </div>
  )
}
