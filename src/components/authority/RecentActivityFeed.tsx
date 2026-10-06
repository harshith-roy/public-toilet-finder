import React from 'react'
import type { ComplaintWithToilet } from '../../types'
import {
  getComplaintCategoryLabel,
  getComplaintStatusBadge,
  formatComplaintDate,
} from '../../utils/toiletFormatters'

interface RecentActivityFeedProps {
  complaints: ComplaintWithToilet[]
  onSelectComplaint?: (complaint: ComplaintWithToilet) => void
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  complaints,
  onSelectComplaint,
}) => {
  // Sort by updated_at || created_at descending
  const recentActivities = [...complaints]
    .sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at).getTime()
      const timeB = new Date(b.updated_at || b.created_at).getTime()
      return timeB - timeA
    })
    .slice(0, 6)

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Recent Maintenance Activity
          </h3>
          <p className="text-xs text-slate-500">
            Latest complaint updates, dispatch notes, and officer actions
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Last {recentActivities.length} Actions
        </span>
      </div>

      {recentActivities.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <svg
            className="w-8 h-8 mx-auto text-slate-300 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          No recent maintenance actions or updates recorded.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recentActivities.map((item) => {
            const statusBadge = getComplaintStatusBadge(item.status)
            const displayTime = formatComplaintDate(item.updated_at || item.created_at)

            return (
              <div
                key={item.id}
                onClick={() => onSelectComplaint?.(item)}
                className={`p-3.5 rounded-lg border border-slate-200/70 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between ${
                  onSelectComplaint ? 'cursor-pointer hover:shadow-xs' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {displayTime}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    {item.toilets?.name || 'Sanitation Facility'}
                  </h4>
                  {item.toilets?.address && (
                    <p className="text-[11px] text-slate-500 truncate mb-1">
                      {item.toilets.address}
                    </p>
                  )}

                  <div className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium mb-2">
                    {getComplaintCategoryLabel(item.category)}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    "{item.description}"
                  </p>
                </div>

                {item.authority_notes ? (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 bg-emerald-50/60 -mx-3.5 -mb-3.5 p-2.5 rounded-b-lg">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                      <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Dispatch Note
                    </div>
                    <p className="text-[11px] text-emerald-950 font-medium line-clamp-2 italic">
                      "{item.authority_notes}"
                    </p>
                  </div>
                ) : (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                    No authority resolution note attached
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
