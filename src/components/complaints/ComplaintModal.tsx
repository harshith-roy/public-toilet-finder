import React, { useState } from 'react'
import type { Toilet, ComplaintCategory } from '../../types'
import { getComplaintCategoryLabel } from '../../utils/toiletFormatters'

interface ComplaintModalProps {
  toilet: Toilet | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (toiletId: string, category: ComplaintCategory, description: string) => Promise<{ success: boolean; error?: string }>
}

const CATEGORIES: ComplaintCategory[] = [
  'cleanliness',
  'damage',
  'water_supply',
  'lighting',
  'safety',
  'other',
]

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  toilet,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [category, setCategory] = useState<ComplaintCategory>('cleanliness')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen || !toilet) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Please describe the problem in at least 10 characters.')
      return
    }

    setSubmitting(true)

    try {
      const res = await onSubmit(toilet.id, category, description.trim())
      if (res.success) {
        setIsSuccess(true)
        setTimeout(() => {
          setIsSuccess(false)
          setDescription('')
          setCategory('cleanliness')
          onClose()
        }, 1500)
      } else {
        setErrorMsg(res.error || 'Failed to submit report. Please try again.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    setErrorMsg(null)
    setIsSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 id="complaint-title" className="text-base font-bold text-slate-900 leading-tight">
                Report a Facility Problem
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                City Maintenance & Sanitation Dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected Toilet Notice */}
        <div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-100 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5" />
          </svg>
          <div className="text-xs">
            <span className="font-semibold text-emerald-900">Target Facility: </span>
            <span className="text-emerald-800 font-medium">{toilet.name}</span>
            {toilet.address && (
              <p className="text-[11px] text-emerald-700/80 mt-0.5">{toilet.address}</p>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">
                Complaint submitted successfully! Municipal dispatch notified.
              </span>
            </div>
          )}

          {/* Issue Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Problem Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={submitting}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                    category === cat
                      ? 'bg-rose-50/80 border-rose-500 text-rose-900 font-semibold ring-1 ring-rose-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{getComplaintCategoryLabel(cat)}</span>
                    {category === cat && (
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="complaint-description" className="block text-xs font-semibold text-slate-700 mb-1">
              Problem Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="complaint-description"
              name="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Please explain the issue in detail (e.g., broken tap, lock damaged, severe cleanliness issue)..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Minimum 10 characters</span>
              <span>{description.trim().length} chars</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isSuccess}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Submitting Complaint...</span>
                </>
              ) : isSuccess ? (
                <span>Submitted!</span>
              ) : (
                <span>Submit Complaint</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
