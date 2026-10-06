import { useState, useEffect, useCallback } from 'react'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface GeolocationState {
  coords: Coordinates | null
  loading: boolean
  error: {
    code?: number
    message: string
    isDenied: boolean
  } | null
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>(() => {
    if (typeof navigator !== 'undefined' && !navigator.geolocation) {
      return {
        coords: null,
        loading: false,
        error: {
          message: 'Geolocation is not supported by your browser.',
          isDenied: false,
        },
      }
    }
    return {
      coords: null,
      loading: true,
      error: null,
    }
  })

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) return

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          loading: false,
          error: null,
        })
      },
      (err) => {
        const isDenied = err.code === err.PERMISSION_DENIED
        let message = 'Unable to determine your location.'

        if (isDenied) {
          message = 'Location permission is required to find public toilets near you.'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location information is currently unavailable. Please check device location settings.'
        } else if (err.code === err.TIMEOUT) {
          message = 'The request to obtain your location timed out. Please retry.'
        }

        setState({
          coords: null,
          loading: false,
          error: {
            code: err.code,
            message,
            isDenied,
          },
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            loading: false,
            error: null,
          })
        },
        (err) => {
          const isDenied = err.code === err.PERMISSION_DENIED
          let message = 'Unable to determine your location.'

          if (isDenied) {
            message = 'Location permission is required to find public toilets near you.'
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'Location information is currently unavailable. Please check device location settings.'
          } else if (err.code === err.TIMEOUT) {
            message = 'The request to obtain your location timed out. Please retry.'
          }

          setState({
            coords: null,
            loading: false,
            error: {
              code: err.code,
              message,
              isDenied,
            },
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    }
  }, [])

  return {
    ...state,
    refreshLocation: requestPosition,
  }
}
