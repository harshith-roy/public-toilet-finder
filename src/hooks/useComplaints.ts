import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { ComplaintWithToilet, ComplaintCategory } from '../types'

export const useComplaints = () => {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<ComplaintWithToilet[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComplaints = useCallback(async () => {
    if (!user) {
      setComplaints([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: selectError } = await supabase
        .from('complaints')
        .select('*, toilets(name, address)')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false })

      if (selectError) {
        throw new Error(selectError.message)
      }

      setComplaints((data as ComplaintWithToilet[]) || [])
    } catch (err: any) {
      console.error('Error fetching complaints from Supabase:', err)
      setError(err.message || 'Failed to fetch complaints')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        setComplaints([])
      } else {
        fetchComplaints()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [user, fetchComplaints])

  const submitComplaint = useCallback(
    async (toiletId: string, category: ComplaintCategory, description: string) => {
      if (!user) {
        return { success: false, error: 'You must be signed in to submit a complaint.' }
      }

      if (!toiletId) {
        return { success: false, error: 'Target toilet is required.' }
      }

      if (!category) {
        return { success: false, error: 'A complaint category must be selected.' }
      }

      if (!description || description.trim().length < 10) {
        return {
          success: false,
          error: 'Please provide a detailed description (at least 10 characters).',
        }
      }

      setSubmitting(true)
      setError(null)

      try {
        const { data, error: insertError } = await supabase
          .from('complaints')
          .insert({
            toilet_id: toiletId,
            citizen_id: user.id,
            category,
            description: description.trim(),
            status: 'submitted',
          })
          .select('*, toilets(name, address)')
          .single()

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Prepend new complaint and refresh list
        if (data) {
          setComplaints((prev) => [data as ComplaintWithToilet, ...prev])
        }
        await fetchComplaints()

        return { success: true, complaint: data as ComplaintWithToilet }
      } catch (err: any) {
        console.error('Error inserting complaint into Supabase:', err)
        const msg = err.message || 'Failed to submit complaint.'
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setSubmitting(false)
      }
    },
    [user, fetchComplaints]
  )

  const confirmResolution = useCallback(
    async (complaintId: string, confirmed: boolean, feedback?: string) => {
      if (!user) {
        return { success: false, error: 'You must be signed in.' }
      }

      try {
        const updatePayload: Record<string, any> = {
          citizen_confirmed: confirmed,
          citizen_feedback: feedback?.trim() || null,
          updated_at: new Date().toISOString(),
        }

        if (!confirmed) {
          updatePayload.status = 'in_progress'
        }

        const { error: updateError } = await supabase
          .from('complaints')
          .update(updatePayload)
          .eq('id', complaintId)
          .eq('citizen_id', user.id)

        if (updateError) {
          throw updateError
        }

        await fetchComplaints()
        return { success: true }
      } catch (err: any) {
        console.error('Error confirming complaint resolution:', err)
        return { success: false, error: err.message || 'Failed to update complaint resolution.' }
      }
    },
    [user, fetchComplaints]
  )

  return {
    complaints,
    loading,
    submitting,
    error,
    refreshComplaints: fetchComplaints,
    submitComplaint,
    confirmResolution,
  }
}
