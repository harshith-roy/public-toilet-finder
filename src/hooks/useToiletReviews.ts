import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ToiletReview } from '../types'

export interface ToiletReviewsSummary {
  averageRating: number | null
  totalReviews: number
  categoryAverages: {
    cleanliness: number | null
    water: number | null
    soap: number | null
    condition: number | null
    lighting: number | null
    safety: number | null
    accessibility: number | null
  }
}

export const useToiletReviews = (toiletId: string | null) => {
  const [reviews, setReviews] = useState<ToiletReview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!toiletId) {
      setReviews([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchErr } = await supabase
        .from('toilet_reviews')
        .select('*')
        .eq('toilet_id', toiletId)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      setReviews((data as ToiletReview[]) || [])
    } catch (err: any) {
      console.error('Error fetching toilet reviews:', err)
      setError(err.message || 'Failed to fetch reviews.')
    } finally {
      setLoading(false)
    }
  }, [toiletId])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchReviews])

  const submitReview = useCallback(
    async (payload: {
      overall_rating: number
      cleanliness_rating?: number | null
      water_rating?: number | null
      soap_rating?: number | null
      condition_rating?: number | null
      lighting_rating?: number | null
      safety_rating?: number | null
      accessibility_rating?: number | null
      review_text?: string | null
    }) => {
      if (!toiletId) {
        throw new Error('No toilet selected.')
      }

      setSubmitting(true)
      setError(null)

      try {
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser()

        if (authErr || !user) {
          throw new Error('You must be signed in as a citizen to submit a review.')
        }

        // Check if user already submitted a review for this toilet
        const { data: existingReviews } = await supabase
          .from('toilet_reviews')
          .select('id')
          .eq('toilet_id', toiletId)
          .eq('citizen_id', user.id)
          .limit(1)

        let resultError: any = null

        if (existingReviews && existingReviews.length > 0) {
          // Update existing review
          const { error: updateErr } = await supabase
            .from('toilet_reviews')
            .update({
              overall_rating: payload.overall_rating,
              cleanliness_rating: payload.cleanliness_rating,
              water_rating: payload.water_rating,
              soap_rating: payload.soap_rating,
              condition_rating: payload.condition_rating,
              lighting_rating: payload.lighting_rating,
              safety_rating: payload.safety_rating,
              accessibility_rating: payload.accessibility_rating,
              review_text: payload.review_text?.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingReviews[0].id)
          resultError = updateErr
        } else {
          // Insert new review
          const { error: insertErr } = await supabase.from('toilet_reviews').insert({
            toilet_id: toiletId,
            citizen_id: user.id,
            overall_rating: payload.overall_rating,
            cleanliness_rating: payload.cleanliness_rating,
            water_rating: payload.water_rating,
            soap_rating: payload.soap_rating,
            condition_rating: payload.condition_rating,
            lighting_rating: payload.lighting_rating,
            safety_rating: payload.safety_rating,
            accessibility_rating: payload.accessibility_rating,
            review_text: payload.review_text?.trim() || null,
          })
          resultError = insertErr
        }

        if (resultError) throw resultError

        await fetchReviews()
      } catch (err: any) {
        console.error('Error submitting review:', err)
        setError(err.message || 'Failed to submit review.')
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [toiletId, fetchReviews]
  )

  // Calculate summary metrics
  const summary: ToiletReviewsSummary = {
    averageRating:
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((acc, r) => acc + r.overall_rating, 0) /
              reviews.length
            ).toFixed(1)
          )
        : null,
    totalReviews: reviews.length,
    categoryAverages: {
      cleanliness: calculateCategoryAverage(reviews, 'cleanliness_rating'),
      water: calculateCategoryAverage(reviews, 'water_rating'),
      soap: calculateCategoryAverage(reviews, 'soap_rating'),
      condition: calculateCategoryAverage(reviews, 'condition_rating'),
      lighting: calculateCategoryAverage(reviews, 'lighting_rating'),
      safety: calculateCategoryAverage(reviews, 'safety_rating'),
      accessibility: calculateCategoryAverage(reviews, 'accessibility_rating'),
    },
  }

  return {
    reviews,
    summary,
    loading,
    submitting,
    error,
    refreshReviews: fetchReviews,
    submitReview,
  }
}

function calculateCategoryAverage(
  reviews: ToiletReview[],
  key: keyof ToiletReview
): number | null {
  const rated = reviews.filter((r) => typeof r[key] === 'number')
  if (rated.length === 0) return null
  const total = rated.reduce((acc, r) => acc + (r[key] as number), 0)
  return Number((total / rated.length).toFixed(1))
}
