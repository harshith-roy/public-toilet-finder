import React, { useState } from 'react'
import type { ComplaintWithToilet } from '../../types'
import {
  getComplaintCategoryLabel,
  getComplaintStatusBadge,
  formatComplaintDate,
} from '../../utils/toiletFormatters'

interface MyComplaintsModalProps {
  complaints: ComplaintWithToilet[]
  loading: boolean
  error: string | null
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  onConfirmResolution?: (
    complaintId: string,
    confirmed: boolean,
    feedback?: string
  ) => Promise<{ success: boolean; error?: string } | void>
}

export const MyComplaintsModal: React.FC<MyComplaintsModalProps> = ({
  complaints,
  loading,
  error,
  isOpen,
  onClose,
  onRefresh,
  onConfirmResolution,
}) => {
  const [reopeningId, setReopeningId] = useState<string | null>(null)
  const [reopenFeedback, setReopenFeedback] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-complaints-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 id="my-complaints-title" className="text-base font-bold text-slate-900 leading-tight">
                My Reported Complaints
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track status and maintenance updates from municipal authorities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh complaints"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold">Error loading complaints</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {loading && complaints.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">Loading your filed complaints...</p>
            </div>
          )}

          {!loading && complaints.length === 0 && !error && (
            <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-xl border border-slate-200/80 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700">No Complaints Submitted</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You have not reported any facility issues yet. Select a public toilet on the map and click &ldquo;Report a Problem&rdquo; to file a complaint.
                </p>
              </div>
            </div>
          )}

          {complaints.map((c) => {
            const statusBadge = getComplaintStatusBadge(c.status)
            return (
              <div
                key={c.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all text-left space-y-2.5"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {c.toilets?.name || 'Public Toilet Facility'}
                    </h4>
                    {c.toilets?.address && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.toilets.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                      {getComplaintCategoryLabel(c.category)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-700 bg-slate-50/70 p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {c.description}
                </p>

                {/* Authority Notes */}
                {c.authority_notes && (
                  <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-lg text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Authority Resolution Notes
                    </span>
                    <p className="text-purple-900 font-medium">{c.authority_notes}</p>
                  </div>
                )}

                {/* Citizen Resolution Confirmation / Reopen Loop */}
                {c.status === 'resolved' && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                    {c.citizen_confirmed === true ? (
                      <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>You confirmed this issue was resolved. Thank you!</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800">
                            Authority marked this issue as resolved. Was this issue resolved?
                          </p>
                        </div>
                        {reopeningId === c.id ? (
                          <div className="space-y-2 pt-1 border-t border-emerald-200/60">
                            <textarea
                              rows={2}
                              value={reopenFeedback}
                              onChange={(e) => setReopenFeedback(e.target.value)}
                              placeholder="Why is this issue not resolved? (optional)"
                              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReopeningId(null)
                                  setReopenFeedback('')
                                }}
                                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === c.id}
                                onClick={async () => {
                                  if (onConfirmResolution) {
                                    setActionLoading(c.id)
                                    await onConfirmResolution(c.id, false, reopenFeedback)
                                    setActionLoading(null)
                                    setReopeningId(null)
                                    setReopenFeedback('')
                                  }
                                }}
                                className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                              >
                                {actionLoading === c.id ? 'Reopening...' : 'Confirm Reopen'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={actionLoading === c.id}
                              onClick={async () => {
                                if (onConfirmResolution) {
                                  setActionLoading(c.id)
                                  await onConfirmResolution(c.id, true)
                                  setActionLoading(null)
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Yes, issue resolved</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === c.id}
                              onClick={() => {
                                setReopeningId(c.id)
                                setReopenFeedback('')
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>No, reopen complaint</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* If reopened previously */}
                {c.status === 'in_progress' && c.citizen_confirmed === false && c.citizen_feedback && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Citizen Reopen Note
                    </span>
                    <p className="text-amber-900">{c.citizen_feedback}</p>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                  <span className="font-mono text-[10px]">ID: {c.id.slice(0, 8)}...</span>
                  <span>Reported on {formatComplaintDate(c.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Total complaints: {complaints.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
