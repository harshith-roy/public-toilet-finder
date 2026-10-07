import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Toilet } from '../types'
import type { Coordinates } from './useGeolocation'

export const RADIUS_OPTIONS = [1, 2, 5, 10] as const
export type RadiusOption = (typeof RADIUS_OPTIONS)[number]

export const useNearbyToilets = (coords: Coordinates | null) => {
  const [toilets, setToilets] = useState<Toilet[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [radiusKm, setRadiusKm] = useState<RadiusOption>(5)

  const activeRequestId = useRef(0)

  const executeFetch = useCallback(
    async (targetCoords: Coordinates, radius: RadiusOption) => {
      // Strict coordinate verification before invoking RPC:
      // Must be finite numbers and cannot be (0, 0) / null converted to zero
      if (
        !targetCoords ||
        typeof targetCoords.latitude !== 'number' ||
        typeof targetCoords.longitude !== 'number' ||
        !Number.isFinite(targetCoords.latitude) ||
        !Number.isFinite(targetCoords.longitude) ||
        (Math.abs(targetCoords.latitude) < 0.0001 && Math.abs(targetCoords.longitude) < 0.0001) ||
        targetCoords.latitude < -90 ||
        targetCoords.latitude > 90 ||
        targetCoords.longitude < -180 ||
        targetCoords.longitude > 180
      ) {
        setToilets([])
        setLoading(false)
        return
      }

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

  const lat = coords?.latitude
  const lng = coords?.longitude

  useEffect(() => {
    const isCoordsValid =
      coords &&
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !(Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)

    const timer = setTimeout(() => {
      if (isCoordsValid) {
        executeFetch(coords, radiusKm)
      } else {
        setToilets([])
        setLoading(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [coords, lat, lng, radiusKm, executeFetch])

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
