import { useState, useCallback } from 'react'
import type {
  Toilet,
  AIRecommendResponse,
  AIAssistReportResponse,
  AIAuthorityInsightResponse,
  ComplaintWithToilet,
  AuthorityToiletSummary,
} from '../types'
import type { Coordinates } from './useGeolocation'

export const useAIAssistant = () => {
  const [recommendation, setRecommendation] = useState<AIRecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const askAssistant = useCallback(
    async (
      query: string,
      candidateToilets: Toilet[],
      userCoords: Coordinates | null
    ): Promise<AIRecommendResponse | null> => {
      // Enforcement: Browser GPS is the single source of truth
      if (!userCoords) {
        const noLocationMsg = 'Allow location access so I can recommend toilets near you.'
        setError(noLocationMsg)
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const payload = {
          action: 'recommend',
          query: query.trim(),
          candidateToilets: candidateToilets.map((t) => ({
            id: t.id,
            name: t.name,
            latitude: t.latitude,
            longitude: t.longitude,
            distance_km: t.distance_km,
            cleanliness_status: t.cleanliness_status,
            operational_status: t.operational_status,
            facilities: t.facilities,
            address: t.address,
          })),
          userCoords,
        }

        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`)
        }

        const data: AIRecommendResponse = await res.json()

        // Double client-side validation: verify recommended toilet IDs exist in candidates
        const candidateMap = new Map(candidateToilets.map((t) => [t.id, t]))
        const safeRecs = (data.recommendations || []).filter((r) => candidateMap.has(r.toilet_id))

        const safeResponse: AIRecommendResponse = {
          answer: data.answer || 'Here are my recommendations based on verified records.',
          recommendations: safeRecs,
          timestamp: data.timestamp || new Date().toISOString(),
        }

        setRecommendation(safeResponse)
        return safeResponse
      } catch (err: any) {
        console.error('Error querying AI assistant:', err)
        setError(err.message || 'Failed to reach AI assistant. Please try again.')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const assistReport = useCallback(
    async (
      toiletName: string,
      draftDescription: string
    ): Promise<AIAssistReportResponse | null> => {
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'assist_report',
            toiletName,
            draftDescription,
          }),
        })

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`)
        }

        return await res.json()
      } catch (err: any) {
        console.error('Error assisting report with AI:', err)
        return null
      }
    },
    []
  )

  const getAuthorityInsights = useCallback(
    async (
      toilets: AuthorityToiletSummary[],
      complaints: ComplaintWithToilet[]
    ): Promise<AIAuthorityInsightResponse | null> => {
      try {
        const categoryCounts: Record<string, number> = {}
        const toiletCounts: Record<string, { name: string; count: number }> = {}

        complaints.forEach((c) => {
          categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1
          const name = c.toilets?.name || toilets.find((t) => t.id === c.toilet_id)?.name || 'Facility'
          if (!toiletCounts[c.toilet_id]) {
            toiletCounts[c.toilet_id] = { name, count: 0 }
          }
          toiletCounts[c.toilet_id].count += 1
        })

        const summary = {
          totalComplaints: complaints.length,
          totalToilets: toilets.length,
          categoryCounts,
          topToilets: Object.values(toiletCounts).sort((a, b) => b.count - a.count).slice(0, 3),
        }

        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'authority_insights',
            summary,
          }),
        })

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`)
        }

        return await res.json()
      } catch (err: any) {
        console.error('Error fetching authority insights:', err)
        return null
      }
    },
    []
  )

  const clearRecommendation = useCallback(() => {
    setRecommendation(null)
    setError(null)
  }, [])

  return {
    recommendation,
    loading,
    error,
    askAssistant,
    assistReport,
    getAuthorityInsights,
    clearRecommendation,
  }
}
