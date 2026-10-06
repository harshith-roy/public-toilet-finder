import React, { useMemo } from 'react'
import type { ComplaintWithToilet, AuthorityToiletSummary, FacilityReportStats, ComplaintCategory } from '../../types'
import { getComplaintCategoryLabel } from '../../utils/toiletFormatters'

interface OperationsAnalyticsProps {
  toilets: AuthorityToiletSummary[]
  complaints: ComplaintWithToilet[]
}

const CATEGORY_COLORS: Record<ComplaintCategory, { bar: string; text: string; bg: string }> = {
  cleanliness: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  damage: { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
  water_supply: { bar: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50' },
  lighting: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  safety: { bar: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
  other: { bar: 'bg-slate-500', text: 'text-slate-700', bg: 'bg-slate-50' },
}

const ALL_CATEGORIES: ComplaintCategory[] = [
  'cleanliness',
  'damage',
  'water_supply',
  'lighting',
  'safety',
  'other',
]

export const OperationsAnalytics: React.FC<OperationsAnalyticsProps> = ({
  toilets,
  complaints,
}) => {
  // Category Breakdown
  const categoryStats = useMemo(() => {
    const total = complaints.length
    return ALL_CATEGORIES.map((cat) => {
      const count = complaints.filter((c) => c.category === cat).length
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0
      return {
        category: cat,
        label: getComplaintCategoryLabel(cat),
        count,
        percentage,
        colors: CATEGORY_COLORS[cat],
      }
    }).sort((a, b) => b.count - a.count)
  }, [complaints])

  // Most Reported Facilities
  const facilityReports = useMemo<FacilityReportStats[]>(() => {
    if (complaints.length === 0) return []

    const map = new Map<string, { total: number; unresolved: number; name: string; address: string | null }>()

    complaints.forEach((c) => {
      const toiletId = c.toilet_id
      const existing = map.get(toiletId)
      const isUnresolved = c.status === 'submitted' || c.status === 'in_progress'

      if (existing) {
        existing.total += 1
        if (isUnresolved) existing.unresolved += 1
      } else {
        const toiletInfo = toilets.find((t) => t.id === toiletId)
        const name = toiletInfo?.name || c.toilets?.name || 'Unknown Facility'
        const address = toiletInfo?.address || c.toilets?.address || null
        map.set(toiletId, {
          total: 1,
          unresolved: isUnresolved ? 1 : 0,
          name,
          address,
        })
      }
    })

    const results: FacilityReportStats[] = []
    map.forEach((val, id) => {
      results.push({
        toiletId: id,
        toiletName: val.name,
        address: val.address,
        totalComplaints: val.total,
        unresolvedComplaints: val.unresolved,
      })
    })

    return results.sort((a, b) => {
      if (b.totalComplaints !== a.totalComplaints) {
        return b.totalComplaints - a.totalComplaints
      }
      return b.unresolvedComplaints - a.unresolvedComplaints
    })
  }, [complaints, toilets])

  // Resolution Time Metric (for status === 'resolved')
  const resolutionMetrics = useMemo(() => {
    const resolvedList = complaints.filter(
      (c) => c.status === 'resolved' && c.created_at && c.updated_at
    )

    if (resolvedList.length === 0) {
      return {
        hasData: false,
        count: 0,
        text: 'No complaints marked as resolved yet to measure resolution turnaround.',
      }
    }

    const totalHours = resolvedList.reduce((acc, c) => {
      const created = new Date(c.created_at).getTime()
      const updated = new Date(c.updated_at).getTime()
      const diffHours = Math.max(0, (updated - created) / (1000 * 60 * 60))
      return acc + diffHours
    }, 0)

    const avgHours = totalHours / resolvedList.length
    const formatted =
      avgHours < 1
        ? `${Math.round(avgHours * 60)} minutes`
        : avgHours < 24
        ? `${avgHours.toFixed(1)} hours`
        : `${(avgHours / 24).toFixed(1)} days`

    return {
      hasData: true,
      count: resolvedList.length,
      formatted,
      text: `Average Resolution Time: ${formatted} (based on ${resolvedList.length} resolved ${resolvedList.length === 1 ? 'report' : 'reports'})`,
    }
  }, [complaints])

  // Dynamic Operational Insights
  const operationalInsights = useMemo(() => {
    if (complaints.length === 0) {
      return ['Not enough data for an operational insight.']
    }

    const insights: string[] = []

    // 1. Pending action statement
    const openCount = complaints.filter(
      (c) => c.status === 'submitted' || c.status === 'in_progress'
    ).length
    if (openCount > 0) {
      insights.push(
        `${openCount} ${openCount === 1 ? 'complaint is' : 'complaints are'} currently awaiting municipal action.`
      )
    } else {
      insights.push('All submitted citizen complaints are currently resolved or closed.')
    }

    // 2. Most frequent category
    const topCategory = categoryStats[0]
    if (topCategory && topCategory.count > 0) {
      insights.push(
        `${topCategory.label} is the most reported issue (${topCategory.count} ${topCategory.count === 1 ? 'report' : 'reports'}, ${topCategory.percentage}% of all complaints).`
      )
    }

    // 3. Most reported facility
    const topFacility = facilityReports[0]
    if (topFacility) {
      insights.push(
        `"${topFacility.toiletName}" has the highest number of reports (${topFacility.totalComplaints} ${topFacility.totalComplaints === 1 ? 'report' : 'reports'}).`
      )
    }

    // 4. Sanitation / Operational readiness
    if (toilets.length > 0) {
      const operationalCount = toilets.filter(
        (t) => t.operational_status === 'operational'
      ).length
      const rate = Math.round((operationalCount / toilets.length) * 100)
      insights.push(
        `${operationalCount} of ${toilets.length} public toilets (${rate}%) are currently operational.`
      )
    }

    return insights
  }, [complaints, categoryStats, facilityReports, toilets])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Category Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Complaint Categories
              </h3>
              <p className="text-xs text-slate-500">Distribution across report types</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {complaints.length} Total
            </span>
          </div>

          <div className="space-y-3">
            {categoryStats.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${cat.colors.bar}`}
                    />
                    {cat.label}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {cat.count} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${cat.colors.bar}`}
                    style={{ width: `${Math.max(cat.count > 0 ? 5 : 0, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {complaints.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center mt-4">
            No complaints recorded to visualize category distribution.
          </p>
        )}
      </div>

      {/* 2. Most Reported Facilities */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Most Reported Facilities
              </h3>
              <p className="text-xs text-slate-500">Ranked by total citizen reports</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {facilityReports.length} Flagged
            </span>
          </div>

          {facilityReports.length === 0 ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              No complaints recorded against any facility.
            </div>
          ) : (
            <div className="space-y-3">
              {facilityReports.slice(0, 4).map((fac, idx) => (
                <div
                  key={fac.toiletId}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {fac.toiletName}
                        </p>
                      </div>
                      {fac.address && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {fac.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-200/80 text-slate-800"
                        title="Total complaints"
                      >
                        {fac.totalComplaints} total
                      </span>
                      {fac.unresolvedComplaints > 0 && (
                        <span
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200"
                          title="Unresolved complaints"
                        >
                          {fac.unresolvedComplaints} open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {facilityReports.length > 4 && (
          <p className="text-[11px] text-slate-400 text-center mt-3">
            + {facilityReports.length - 4} more facilities in log
          </p>
        )}
      </div>

      {/* 3. Operational Insights & Resolution Time */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Operational Insights
              </h3>
              <p className="text-xs text-slate-500">Live intelligence derived from database</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live sync" />
          </div>

          <div className="space-y-2.5">
            {operationalInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-700 bg-emerald-50/50 border border-emerald-100/60 p-2.5 rounded-lg"
              >
                <svg
                  className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Turnaround / Resolution Time Section */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Turnaround Benchmark</span>
            {resolutionMetrics.hasData && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                {resolutionMetrics.formatted} avg
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            {resolutionMetrics.text}
          </p>
        </div>
      </div>
    </div>
  )
}
