import React, { useState } from 'react'
import type { Toilet, AIRecommendResponse } from '../../types'
import type { Coordinates } from '../../hooks/useGeolocation'
import {
  getCleanlinessBadge,
  getOperationalBadge,
} from '../../utils/toiletFormatters'

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  toilets: Toilet[]
  userCoords: Coordinates | null
  locatingUser: boolean
  onRefreshLocation: () => void
  onSelectToilet: (toilet: Toilet) => void
  onNavigateToilet: (toilet: Toilet) => void
  onAsk: (query: string) => Promise<AIRecommendResponse | null>
  loading: boolean
  recommendation: AIRecommendResponse | null
  error: string | null
}

const QUICK_PROMPTS = [
  'Find the cleanest nearby toilet',
  'Best accessible toilet',
  'Closest toilet with good reviews',
  'Best overall nearby',
  'I need water and soap',
]

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  toilets,
  userCoords,
  locatingUser,
  onRefreshLocation,
  onSelectToilet,
  onNavigateToilet,
  onAsk,
  loading,
  recommendation,
  error,
}) => {
  const [query, setQuery] = useState('')

  if (!isOpen) return null

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt)
    onAsk(prompt)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return
    onAsk(query.trim())
  }

  // Map toilet IDs to candidate objects for actions
  const toiletMap = new Map<string, Toilet>(toilets.map((t) => [t.id, t]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ai-assistant-title" className="text-base sm:text-lg font-bold leading-tight tracking-tight">
                  AI Smart Toilet Assistant
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                  S5 Smart City
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time recommendations grounded in live municipal data & citizen ratings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close assistant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Location Grounding Status Banner */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
          {userCoords ? (
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">GPS Active:</span>
              <span className="font-mono text-[11px] text-slate-600">
                {userCoords.latitude.toFixed(4)}°N, {userCoords.longitude.toFixed(4)}°E
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">
                {toilets.length} candidate toilets loaded
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-amber-800 font-medium">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>GPS location not yet acquired. Location access required for nearby recommendations.</span>
              </div>
              <button
                type="button"
                onClick={onRefreshLocation}
                disabled={locatingUser}
                className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {locatingUser ? 'Acquiring...' : 'Enable Location'}
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Prompts Bar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Suggested Questions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  disabled={loading || !userCoords}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left font-medium"
                >
                  ✨ {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Natural Language Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading || !userCoords}
                placeholder={
                  userCoords
                    ? 'Ask anything (e.g. Find me the cleanest toilet with wheelchair access)...'
                    : 'Please allow GPS location above to ask questions...'
                }
                className="w-full pl-3.5 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:bg-slate-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !query.trim() || !userCoords}
                className="absolute right-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <span>Ask AI</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* AI Response Area */}
          {recommendation && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
              {/* Answer Card */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                    <span>💡</span> AI Assessment & Analysis
                  </span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold">
                    Grounded in Supabase Records
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {recommendation.answer}
                </p>
              </div>

              {/* Recommended Toilets Section */}
              {recommendation.recommendations.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎯</span> Verified Recommended Options ({recommendation.recommendations.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">Ranked by criteria match</span>
                  </div>

                  <div className="space-y-3">
                    {recommendation.recommendations.map((item, idx) => {
                      const matchedToilet = toiletMap.get(item.toilet_id)
                      const cleanBadge = getCleanlinessBadge(item.cleanliness_status as any)
                      const opBadge = getOperationalBadge(item.operational_status as any)

                      return (
                        <div
                          key={item.toilet_id}
                          className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-xs transition-all flex flex-col gap-3"
                        >
                          {/* Toilet Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                  {item.name}
                                </h4>
                                {typeof item.distance_km === 'number' && (
                                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                                    📍 {item.distance_km.toFixed(1)} km away
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${cleanBadge.bg}`}>
                                {cleanBadge.label}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${opBadge.bg}`}>
                                {opBadge.label}
                              </span>
                            </div>
                          </div>

                          {/* Facilities Pills */}
                          {item.facilities && item.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.facilities.map((f, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium"
                                >
                                  ✓ {f}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Why this toilet? Reason Block */}
                          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-emerald-600 font-bold shrink-0">Why:</span>
                            <span className="italic">{item.reason}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            {matchedToilet && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectToilet(matchedToilet)
                                  onClose()
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                              >
                                View Details
                              </button>
                            )}

                            {matchedToilet && (
                              <button
                                type="button"
                                onClick={() => onNavigateToilet(matchedToilet)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Navigate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No specific toilet matched this filter. Try adjusting your question or expanding the radius.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span>AI is strictly grounded in live database records. No synthetic toilets.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
