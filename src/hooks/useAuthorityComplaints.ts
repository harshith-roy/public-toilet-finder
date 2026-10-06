import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { ComplaintWithToilet, ComplaintStatus, AuthorityToiletSummary } from '../types'

export const useAuthorityComplaints = () => {
  const { user, profile } = useAuth()
  const [complaints, setComplaints] = useState<ComplaintWithToilet[]>([])
  const [toilets, setToilets] = useState<AuthorityToiletSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthority = profile?.role === 'authority'

  const fetchAllData = useCallback(async () => {
    if (!user || !isAuthority) {
      setComplaints([])
      setToilets([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [complaintsRes, toiletsRes] = await Promise.all([
        supabase
          .from('complaints')
          .select('*, toilets(name, address)')
          .order('created_at', { ascending: false }),
        supabase
          .from('toilets')
          .select('id, name, address, operational_status, cleanliness_status')
          .order('name', { ascending: true }),
      ])

      if (complaintsRes.error) {
        throw new Error(complaintsRes.error.message)
      }
      if (toiletsRes.error) {
        throw new Error(toiletsRes.error.message)
      }

      setComplaints((complaintsRes.data as ComplaintWithToilet[]) || [])
      setToilets((toiletsRes.data as AuthorityToiletSummary[]) || [])
    } catch (err: any) {
      console.error('Error fetching authority operations data:', err)
      setError(err.message || 'Failed to load operational data')
      setComplaints([])
      setToilets([])
    } finally {
      setLoading(false)
    }
  }, [user, isAuthority])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchAllData])

  const updateComplaint = useCallback(
    async (
      complaintId: string,
      status: ComplaintStatus,
      authorityNotes: string | null
    ): Promise<{ success: boolean; error?: string; complaint?: ComplaintWithToilet }> => {
      if (!isAuthority) {
        return { success: false, error: 'Unauthorized: Authority access required.' }
      }

      setSaving(true)
      setError(null)

      try {
        const updatePayload = {
          status,
          authority_notes: authorityNotes ? authorityNotes.trim() : null,
          updated_at: new Date().toISOString(),
        }

        const { data, error: updateError } = await supabase
          .from('complaints')
          .update(updatePayload)
          .eq('id', complaintId)
          .select('*, toilets(name, address)')
          .single()

        if (updateError) {
          throw new Error(updateError.message)
        }

        const updated = data as ComplaintWithToilet
        setComplaints((prev) =>
          prev.map((item) => (item.id === complaintId ? updated : item))
        )

        return { success: true, complaint: updated }
      } catch (err: any) {
        console.error('Error updating complaint in Supabase:', err)
        const msg = err.message || 'Failed to update complaint'
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setSaving(false)
      }
    },
    [isAuthority]
  )

  return {
    toilets,
    complaints,
    loading,
    saving,
    error,
    refreshComplaints: fetchAllData,
    updateComplaint,
  }
}
