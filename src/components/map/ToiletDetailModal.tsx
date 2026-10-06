import React, { useState, useEffect } from 'react'
import type { Toilet, ComplaintCategory, ComplaintStatus } from '../../types'
import {
  formatDistance,
  getCleanlinessBadge,
  getOperationalBadge,
  getComplaintCategoryLabel,
  getComplaintStatusBadge,
  formatComplaintDate,
} from '../../utils/toiletFormatters'
import { useToiletReviews } from '../../hooks/useToiletReviews'
import { ReviewModal } from '../reviews/ReviewModal'
import { supabase } from '../../lib/supabase'

interface ToiletDetailModalProps {
  toilet: Toilet | null
  onClose: () => void
  onReportProblem?: (toilet: Toilet) => void
}

interface CommunityReport {
  id: string
  category: ComplaintCategory
  description: string
  status: ComplaintStatus
  authority_notes: string | null
  created_at: string
}

export const ToiletDetailModal: React.FC<ToiletDetailModalProps> = ({
  toilet,
  onClose,
  onReportProblem,
}) => {
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)

  const {
    reviews,
    summary,
    loading: loadingReviews,
    submitReview,
  } = useToiletReviews(toilet ? toilet.id : null)

  // Fetch community complaints for this toilet without leaking citizen identity
  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      if (!toilet) {
        if (isMounted) setCommunityReports([])
        return
      }

      const fetchCommunityReports = async () => {
        setLoadingReports(true)
        try {
          const { data, error } = await supabase
            .from('complaints')
            .select('id, category, description, status, authority_notes, created_at')
            .eq('toilet_id', toilet.id)
            .order('created_at', { ascending: false })
            .limit(5)

          if (!error && data && isMounted) {
            setCommunityReports(data as CommunityReport[])
          }
        } catch (err) {
          console.error('Error fetching community reports:', err)
        } finally {
          if (isMounted) setLoadingReports(false)
        }
      }

      fetchCommunityReports()
    }, 0)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [toilet])

  if (!toilet) return null

  const cleanBadge = getCleanlinessBadge(toilet.cleanliness_status)
  const operBadge = getOperationalBadge(toilet.operational_status)
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${toilet.latitude},${toilet.longitude}`

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in">
        <div
          className="w-full max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="toilet-title"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div className="min-w-0 pr-2">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  {formatDistance(toilet.distance_km)} away
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${cleanBadge.bg}`}>
                  {cleanBadge.label}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${operBadge.bg}`}>
                  {operBadge.label}
                </span>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {toilet.source_type || 'Government / ULB'}
                </span>
              </div>
              <h2 id="toilet-title" className="text-lg font-bold text-slate-900 truncate">
                {toilet.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Description */}
            {toilet.description && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {toilet.description}
                </p>
              </div>
            )}

            {/* Address & Location */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Address & Location
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{toilet.address || 'Address not listed'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 pl-6">
                  Coordinates: {toilet.latitude.toFixed(6)}, {toilet.longitude.toFixed(6)}
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Available Facilities
              </h4>
              {toilet.facilities && toilet.facilities.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {toilet.facilities.map((facility, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-xs text-emerald-900 font-medium"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No facility details provided.</p>
              )}
            </div>

            {/* CITIZEN HYGIENE RATINGS & REVIEWS SECTION */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Citizen Hygiene Rating
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {loadingReviews ? (
                      <span className="text-xs text-slate-400">Loading ratings...</span>
                    ) : summary.averageRating !== null ? (
                      <>
                        <span className="text-base font-extrabold text-amber-600">
                          ★ {summary.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-500">
                          / 5.0 ({summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No citizen reviews yet
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>Rate / Review</span>
                </button>
              </div>

              {/* Criteria breakdown if reviews exist */}
              {summary.totalReviews > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2.5 bg-amber-50/40 rounded-xl border border-amber-100 text-[11px] mb-3">
                  {summary.categoryAverages.cleanliness !== null && (
                    <div className="text-slate-600">
                      Cleanliness: <strong className="text-slate-800">{summary.categoryAverages.cleanliness}★</strong>
                    </div>
                  )}
                  {summary.categoryAverages.water !== null && (
                    <div className="text-slate-600">
                      Water: <strong className="text-slate-800">{summary.categoryAverages.water}★</strong>
                    </div>
                  )}
                  {summary.categoryAverages.soap !== null && (
                    <div className="text-slate-600">
                      Soap: <strong className="text-slate-800">{summary.categoryAverages.soap}★</strong>
                    </div>
                  )}
                  {summary.categoryAverages.condition !== null && (
                    <div className="text-slate-600">
                      Condition: <strong className="text-slate-800">{summary.categoryAverages.condition}★</strong>
                    </div>
                  )}
                  {summary.categoryAverages.lighting !== null && (
                    <div className="text-slate-600">
                      Lighting: <strong className="text-slate-800">{summary.categoryAverages.lighting}★</strong>
                    </div>
                  )}
                  {summary.categoryAverages.safety !== null && (
                    <div className="text-slate-600">
                      Safety: <strong className="text-slate-800">{summary.categoryAverages.safety}★</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Recent citizen reviews list */}
              {reviews.length > 0 && (
                <div className="space-y-2 mt-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Recent Citizen Reviews ({reviews.length})
                  </h5>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {reviews.slice(0, 3).map((rev) => (
                      <div
                        key={rev.id}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-700 flex items-center gap-1">
                            {'★'.repeat(rev.overall_rating)}
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({rev.overall_rating}/5)
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatComplaintDate(rev.created_at)}
                          </span>
                        </div>
                        {rev.review_text && (
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {rev.review_text}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">Verified Citizen Review</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COMMUNITY REPORTS SECTION */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Community Problem Reports
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {communityReports.length} {communityReports.length === 1 ? 'report' : 'reports'}
                </span>
              </div>

              {loadingReports ? (
                <p className="text-xs text-slate-400 py-2">Loading reports...</p>
              ) : communityReports.length === 0 ? (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No active complaints reported by citizens for this facility.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {communityReports.map((report) => {
                    const statusBadge = getComplaintStatusBadge(report.status)
                    return (
                      <div
                        key={report.id}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">
                              {getComplaintCategoryLabel(report.category)}
                            </span>
                            <span className="text-[10px] text-slate-400">• Citizen Report</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {report.description}
                        </p>
                        {report.authority_notes && (
                          <div className="p-1.5 bg-purple-50 rounded border border-purple-100 text-[10px] text-purple-900">
                            <strong>Authority:</strong> {report.authority_notes}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400">
                          {formatComplaintDate(report.created_at)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer / Navigation & Report Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="order-3 sm:order-1 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            <div className="order-1 sm:order-2 flex-1 flex items-center gap-2 w-full sm:w-auto">
              {onReportProblem && (
                <button
                  type="button"
                  onClick={() => onReportProblem(toilet)}
                  className="py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-semibold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Report facility problem or maintenance requirement"
                >
                  <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Report Problem</span>
                </button>
              )}

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Navigate Here</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        toilet={toilet}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={submitReview}
      />
    </>
  )
}
