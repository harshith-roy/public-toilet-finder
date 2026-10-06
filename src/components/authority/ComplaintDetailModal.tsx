import React, { useState } from 'react'
import type { ComplaintWithToilet, ComplaintStatus } from '../../types'
import {
  getComplaintCategoryLabel,
  getComplaintStatusBadge,
  formatComplaintDate,
} from '../../utils/toiletFormatters'

interface ComplaintDetailModalProps {
  complaint: ComplaintWithToilet | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (
    complaintId: string,
    status: ComplaintStatus,
    notes: string | null
  ) => Promise<{ success: boolean; error?: string }>
}

const STATUS_OPTIONS: { value: ComplaintStatus; label: string; desc: string }[] = [
  { value: 'submitted', label: 'Submitted', desc: 'New report awaiting dispatch' },
  { value: 'in_progress', label: 'In Progress', desc: 'Crew or maintenance officer dispatched' },
  { value: 'resolved', label: 'Resolved', desc: 'Repairs/cleaning verified complete' },
  { value: 'rejected', label: 'Rejected', desc: 'Invalid, duplicate, or duplicate report' },
]

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [status, setStatus] = useState<ComplaintStatus>(() => complaint?.status || 'submitted')
  const [notes, setNotes] = useState<string>(() => complaint?.authority_notes || '')
  const [saving, setSaving] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen || !complaint) return null

  const currentBadge = getComplaintStatusBadge(complaint.status)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setSaving(true)

    try {
      const res = await onUpdate(complaint.id, status, notes)
      if (res.success) {
        setSuccessMsg('Complaint status and notes updated successfully!')
        setTimeout(() => {
          setSuccessMsg(null)
        }, 3000)
      } else {
        setErrorMsg(res.error || 'Failed to save changes')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const hasUnsavedChanges =
    status !== complaint.status || notes.trim() !== (complaint.authority_notes || '').trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authority-modal-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">
                  ID: {complaint.id.slice(0, 8)}...
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentBadge.bg}`}>
                  {currentBadge.label}
                </span>
              </div>
              <h2 id="authority-modal-title" className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                {complaint.toilets?.name || 'Public Facility'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Facility Address</span>
              <p className="font-medium text-slate-800">{complaint.toilets?.address || 'Not specified'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Problem Category</span>
              <p className="font-semibold text-slate-800">{getComplaintCategoryLabel(complaint.category)}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Citizen Reference</span>
              <p className="font-mono text-[11px] text-slate-600 truncate">Citizen {complaint.citizen_id.slice(0, 13)}...</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submitted On</span>
              <p className="text-slate-700">{formatComplaintDate(complaint.created_at)}</p>
            </div>
          </div>

          {/* Citizen Description */}
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Citizen Problem Description</span>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="pt-2 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Update Dispatch Status <span className="text-purple-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    disabled={saving}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                      status === opt.value
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-semibold ring-2 ring-purple-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="authority-notes" className="block text-xs font-bold text-slate-700 mb-1">
                Authority Resolution Notes <span className="text-slate-400 font-normal">(Visible to citizen)</span>
              </label>
              <textarea
                id="authority-notes"
                name="authorityNotes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
                placeholder="Add actions taken, crew dispatch reference, or reason for resolution/rejection..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Last updated: {formatComplaintDate(complaint.updated_at)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={saving || !hasUnsavedChanges}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Update</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
