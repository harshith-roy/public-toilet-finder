import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Toilet } from '../types'
import type { Coordinates } from './useGeolocation'

export const RADIUS_OPTIONS = [1, 2, 5, 10] as const
export type RadiusOption = typeof RADIUS_OPTIONS[number]

export const useNearbyToilets = (coords: Coordinates | null) => {
  const [toilets, setToilets] = useState<Toilet[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [radiusKm, setRadiusKm] = useState<RadiusOption>(5)

  const activeRequestId = useRef(0)

  const executeFetch = useCallback(
    async (targetCoords: Coordinates, radius: RadiusOption) => {
      const requestId = ++activeRequestId.current
      setLoading(true)
      setError(null)

      try {
        const { data, error: rpcError } = await supabase.rpc('get_nearby_toilets', {
          user_lat: targetCoords.latitude,
          user_lng: targetCoords.longitude,
          radius_km: radius,
        })

        if (requestId !== activeRequestId.current) return

        if (rpcError) {
          throw new Error(rpcError.message)
        }

        const parsed: Toilet[] = (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,
          cleanliness_status: row.cleanliness_status,
          operational_status: row.operational_status,
          facilities: Array.isArray(row.facilities)
            ? row.facilities
            : typeof row.facilities === 'string'
            ? JSON.parse(row.facilities)
            : [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          distance_km: typeof row.distance_km === 'number' ? row.distance_km : undefined,
          source_type: row.source_type || 'Government / ULB',
        }))

        setToilets(parsed)
      } catch (err: any) {
        if (requestId !== activeRequestId.current) return
        console.error('Error fetching nearby toilets via RPC:', err)
        setError(err.message || 'Failed to query nearby toilets.')
        setToilets([])
      } finally {
        if (requestId === activeRequestId.current) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (coords) {
      // Async trigger to decouple from effect body
      const timer = setTimeout(() => {
        executeFetch(coords, radiusKm)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [coords, radiusKm, executeFetch])

  const refetch = useCallback(() => {
    if (coords) {
      executeFetch(coords, radiusKm)
    }
  }, [coords, radiusKm, executeFetch])

  return {
    toilets,
    loading,
    error,
    radiusKm,
    setRadiusKm,
    refetchToilets: refetch,
  }
}
