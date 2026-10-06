import React, { useState } from 'react'
import type { Toilet } from '../../types'

interface ReviewModalProps {
  toilet: Toilet | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: {
    overall_rating: number
    cleanliness_rating?: number | null
    water_rating?: number | null
    soap_rating?: number | null
    condition_rating?: number | null
    lighting_rating?: number | null
    safety_rating?: number | null
    accessibility_rating?: number | null
    review_text?: string | null
  }) => Promise<void>
}

interface StarPickerProps {
  label: string
  description?: string
  value: number
  onChange: (val: number) => void
  required?: boolean
}

const StarPicker: React.FC<StarPickerProps> = ({
  label,
  description,
  value,
  onChange,
  required = false,
}) => {
  const [hovered, setHovered] = useState<number>(0)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-slate-100 last:border-b-0">
      <div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-800">{label}</span>
          {required && <span className="text-rose-500 text-xs">*</span>}
        </div>
        {description && <p className="text-[11px] text-slate-400">{description}</p>}
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star === value && !required ? 0 : star)}
            className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
            title={`${star} star${star > 1 ? 's' : ''}`}
          >
            <svg
              className={`w-5 h-5 ${
                star <= (hovered || value)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200 fill-slate-100 hover:text-amber-200'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        {value > 0 && !required && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="ml-1 text-[10px] text-slate-400 hover:text-slate-600 underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  toilet,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [overallRating, setOverallRating] = useState<number>(5)
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5)
  const [waterRating, setWaterRating] = useState<number>(0)
  const [soapRating, setSoapRating] = useState<number>(0)
  const [conditionRating, setConditionRating] = useState<number>(0)
  const [lightingRating, setLightingRating] = useState<number>(0)
  const [safetyRating, setSafetyRating] = useState<number>(0)
  const [accessibilityRating, setAccessibilityRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetailedRatings, setShowDetailedRatings] = useState<boolean>(false)

  if (!isOpen || !toilet) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallRating < 1 || overallRating > 5) {
      setError('Please provide an overall rating between 1 and 5 stars.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        overall_rating: overallRating,
        cleanliness_rating: cleanlinessRating > 0 ? cleanlinessRating : null,
        water_rating: waterRating > 0 ? waterRating : null,
        soap_rating: soapRating > 0 ? soapRating : null,
        condition_rating: conditionRating > 0 ? conditionRating : null,
        lighting_rating: lightingRating > 0 ? lightingRating : null,
        safety_rating: safetyRating > 0 ? safetyRating : null,
        accessibility_rating: accessibilityRating > 0 ? accessibilityRating : null,
        review_text: reviewText.trim() ? reviewText.trim() : null,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-white/20 rounded-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </span>
              <h2 className="text-base font-bold truncate">Review & Hygiene Rating</h2>
            </div>
            <p className="text-emerald-100 text-xs truncate mt-0.5">{toilet.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Primary Overall Rating */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Overall Experience Rating <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">How would you rate this public toilet facility?</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  >
                    <svg
                      className={`w-7 h-7 ${
                        star <= overallRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 fill-slate-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle for Category Ratings */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDetailedRatings(!showDetailedRatings)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{showDetailedRatings ? 'Hide detailed criteria ratings' : '+ Add detailed hygiene & facility criteria (optional)'}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showDetailedRatings ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showDetailedRatings && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <StarPicker
                label="Cleanliness & Odour"
                description="Clean floors, odourless, waste bins"
                value={cleanlinessRating}
                onChange={setCleanlinessRating}
              />
              <StarPicker
                label="Water Supply"
                description="Running taps, flush pressure"
                value={waterRating}
                onChange={setWaterRating}
              />
              <StarPicker
                label="Soap & Sanitizer"
                description="Soap dispenser filled and working"
                value={soapRating}
                onChange={setSoapRating}
              />
              <StarPicker
                label="Physical Condition"
                description="Doors, latches, mirrors, tiles"
                value={conditionRating}
                onChange={setConditionRating}
              />
              <StarPicker
                label="Lighting & Ventilation"
                description="Working lights, proper airflow"
                value={lightingRating}
                onChange={setLightingRating}
              />
              <StarPicker
                label="Safety & Security"
                description="Secure locks, well-lit entrance, privacy"
                value={safetyRating}
                onChange={setSafetyRating}
              />
              <StarPicker
                label="Accessibility"
                description="Ramps, grab rails, wheelchair access"
                value={accessibilityRating}
                onChange={setAccessibilityRating}
              />
            </div>
          )}

          {/* Review Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Citizen Comments / Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share honest hygiene feedback, cleanliness remarks, or note missing supplies..."
              maxLength={500}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
            <div className="flex justify-between text-[11px] text-slate-400 px-1">
              <span>Help fellow citizens find clean facilities</span>
              <span>{reviewText.length}/500</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Rating & Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
