import { useState, useEffect, useCallback, useRef } from 'react'

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export type GeolocationStatus =
  | 'idle'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported'

export interface GeolocationState {
  coords: Coordinates | null
  loading: boolean
  status: GeolocationStatus
  error: {
    code?: number
    message: string
    isDenied: boolean
  } | null
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 25000,
}

// Calculate distance in meters using Haversine formula to debounce micro-jitter
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>(() => {
    if (typeof navigator !== 'undefined' && !navigator.geolocation) {
      return {
        coords: null,
        loading: false,
        status: 'unsupported',
        error: {
          code: 0,
          message: 'Geolocation is not supported by your browser.',
          isDenied: false,
        },
      }
    }
    return {
      coords: null,
      loading: true,
      status: 'prompt',
      error: null,
    }
  })

  const lastCoordsRef = useRef<Coordinates | null>(null)

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const lat = position.coords.latitude
    const lng = position.coords.longitude
    const acc = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : 0
    const ts = position.timestamp || Date.now()

    // Strict validation: Coordinates must be valid finite numbers within geographical boundaries.
    // Crucially: (0, 0) represents "null converted to zero" by automated browser runners and must be rejected.
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      lastCoordsRef.current = null
      setState({
        coords: null,
        loading: false,
        status: 'unavailable',
        error: {
          code: 2,
          message: 'Location information is currently unavailable. Please verify device GPS settings.',
          isDenied: false,
        },
      })
      return
    }

    const prev = lastCoordsRef.current
    if (prev) {
      const dist = distanceMeters(prev.latitude, prev.longitude, lat, lng)
      // If position moved less than 15 meters and accuracy is comparable, avoid rerender churn
      if (dist < 15 && Math.abs(prev.accuracy - acc) < 20) {
        return
      }
    }

    const newCoords: Coordinates = {
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      timestamp: ts,
    }
    lastCoordsRef.current = newCoords

    setState({
      coords: newCoords,
      loading: false,
      status: 'granted',
      error: null,
    })
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    // If user position is already successfully established, transient watch timeouts shouldn't wipe it
    if (lastCoordsRef.current && err.code === err.TIMEOUT) {
      return
    }

    const isDenied = err.code === err.PERMISSION_DENIED
    let status: GeolocationStatus = 'unavailable'
    let message = 'Unable to determine your location. Please check device location settings.'

    if (isDenied) {
      status = 'denied'
      message =
        'Location permission is required to find public toilets near you. Please enable location access in your browser settings.'
    } else if (err.code === err.TIMEOUT) {
      status = 'timeout'
      message = 'The request to obtain your location timed out. Please click "Refresh Location" to retry.'
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      status = 'unavailable'
      message =
        'Location information is currently unavailable. Please verify GPS / network location settings.'
    }

    lastCoordsRef.current = null

    setState({
      coords: null,
      loading: false,
      status,
      error: {
        code: err.code,
        message,
        isDenied,
      },
    })
  }, [])

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        coords: null,
        loading: false,
        status: 'unsupported',
        error: {
          message: 'Geolocation is not supported by your browser.',
          isDenied: false,
        },
      })
      return
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      status: prev.status === 'denied' ? 'denied' : 'prompt',
    }))

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, GEO_OPTIONS)
  }, [handleSuccess, handleError])

  useEffect(() => {
    if (!navigator.geolocation) return

    let watchId: number | null = null

    // 1. Initial explicit single fetch
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, GEO_OPTIONS)

    // 2. Continuous real-world updates with debounced accuracy filtering
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => handleSuccess(pos),
        (err) => {
          // If already granted, do not wipe out coords on transient watch glitches
          if (!lastCoordsRef.current) {
            handleError(err)
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 25000,
        }
      )
    } catch (e) {
      console.warn('Geolocation watchPosition unavailable:', e)
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [handleSuccess, handleError])

  return {
    ...state,
    refreshLocation: requestPosition,
  }
}
