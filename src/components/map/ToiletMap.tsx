import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import type { Toilet } from '../../types'
import type { Coordinates } from '../../hooks/useGeolocation'
import { userLocationIcon, getToiletIcon } from '../../utils/leafletIcons'
import {
  formatDistance,
  getCleanlinessBadge,
  getOperationalBadge,
} from '../../utils/toiletFormatters'

interface ToiletMapProps {
  userCoords: Coordinates | null
  toilets: Toilet[]
  selectedToilet: Toilet | null
  radiusKm: number
  recenterTrigger?: number
  onSelectToilet: (toilet: Toilet) => void
  onNavigateToilet: (toilet: Toilet) => void
  onRecenterUser: () => void
}

// Neutral India center before GPS coordinates arrive
const INDIA_CENTER: [number, number] = [20.5937, 78.9629]
const INDIA_ZOOM = 5

const isCoordsValid = (coords: Coordinates | null): coords is Coordinates => {
  return (
    !!coords &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    !(Math.abs(coords.latitude) < 0.0001 && Math.abs(coords.longitude) < 0.0001)
  )
}

// Controller component to manage intentional map viewport transitions without fighting user interaction
const MapViewController: React.FC<{
  userCoords: Coordinates | null
  selectedToilet: Toilet | null
  recenterTrigger?: number
}> = ({ userCoords, selectedToilet, recenterTrigger }) => {
  const map = useMap()
  const hasCenteredInitial = useRef(false)
  const prevRecenterTrigger = useRef(recenterTrigger)
  const prevSelectedId = useRef<string | null>(null)

  // 1. Invalidate size once after mounting to ensure correct container boundaries
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
  }, [map])

  // 2. Viewport synchronization:
  // - If userCoords is valid and hasn't centered yet, center ONCE to user location
  // - If userCoords is null (no GPS / timed out / denied), enforce the neutral India viewport
  useEffect(() => {
    if (isCoordsValid(userCoords) && !hasCenteredInitial.current) {
      hasCenteredInitial.current = true
      map.setView([userCoords.latitude, userCoords.longitude], 14, {
        animate: true,
      })
    } else if (!isCoordsValid(userCoords)) {
      hasCenteredInitial.current = false
      map.setView(INDIA_CENTER, INDIA_ZOOM, {
        animate: false,
      })
    }
  }, [map, userCoords])

  // 3. Explicit recenter request triggered by user ("Center My Location" or "Refresh Location")
  useEffect(() => {
    if (recenterTrigger !== undefined && recenterTrigger !== prevRecenterTrigger.current) {
      prevRecenterTrigger.current = recenterTrigger
      if (isCoordsValid(userCoords)) {
        map.setView([userCoords.latitude, userCoords.longitude], 14, {
          animate: true,
        })
      } else {
        map.setView(INDIA_CENTER, INDIA_ZOOM, {
          animate: true,
        })
      }
    }
  }, [map, userCoords, recenterTrigger])

  // 4. Pan to selected toilet when chosen; crucially, DO NOT fly back to userCoords when deselected
  useEffect(() => {
    if (selectedToilet && selectedToilet.id !== prevSelectedId.current) {
      prevSelectedId.current = selectedToilet.id
      map.panTo([selectedToilet.latitude, selectedToilet.longitude], {
        animate: true,
      })
    } else if (!selectedToilet) {
      prevSelectedId.current = null
      // Retain current viewport; do NOT fight user pan/zoom
    }
  }, [map, selectedToilet])

  return null
}

// Floating recenter button within map context
const RecenterButton: React.FC<{
  userCoords: Coordinates | null
  onRecenterUser: () => void
}> = ({ userCoords, onRecenterUser }) => {
  const map = useMap()

  if (!isCoordsValid(userCoords)) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    map.setView([userCoords.latitude, userCoords.longitude], 14, {
      animate: true,
    })
    onRecenterUser()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute bottom-4 right-4 z-[400] bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs px-3 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
      title="Center map on your location"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
      <span>Center My Location</span>
    </button>
  )
}

export const ToiletMap: React.FC<ToiletMapProps> = ({
  userCoords,
  toilets,
  selectedToilet,
  radiusKm,
  recenterTrigger,
  onSelectToilet,
  onNavigateToilet,
  onRecenterUser,
}) => {
  const validUser = isCoordsValid(userCoords) ? userCoords : null

  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-100 overflow-hidden">
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapViewController
          userCoords={userCoords}
          selectedToilet={selectedToilet}
          recenterTrigger={recenterTrigger}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Marker & Radius Circle — ONLY rendered when real GPS userCoords exists */}
        {validUser && (
          <>
            <Marker
              position={[validUser.latitude, validUser.longitude]}
              icon={userLocationIcon}
            >
              <Popup autoPan={false}>
                <div className="p-1 text-xs">
                  <p className="font-bold text-slate-800">Your Current Location</p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {validUser.latitude.toFixed(5)}, {validUser.longitude.toFixed(5)}
                  </p>
                  {validUser.accuracy > 0 && (
                    <p className="text-slate-400 text-[10px]">
                      Accuracy: ±{Math.round(validUser.accuracy)} meters
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[validUser.latitude, validUser.longitude]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#059669',
                fillColor: '#10b981',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          </>
        )}

        {/* Toilet Markers — Strictly rendered from toilets query; stable key, memoized DivIcon */}
        {toilets.map((toilet) => {
          const isSelected = selectedToilet?.id === toilet.id
          const cleanBadge = getCleanlinessBadge(toilet.cleanliness_status)
          const operBadge = getOperationalBadge(toilet.operational_status)

          return (
            <Marker
              key={toilet.id}
              position={[toilet.latitude, toilet.longitude]}
              icon={getToiletIcon(toilet.cleanliness_status, isSelected)}
              eventHandlers={{
                click: () => {
                  onSelectToilet(toilet)
                },
              }}
            >
              <Popup autoPan={false}>
                <div className="p-1 max-w-[220px] text-xs space-y-1.5">
                  <div className="font-bold text-slate-900 leading-tight text-sm">
                    {toilet.name}
                  </div>
                  {toilet.address && (
                    <div className="text-[11px] text-slate-500 line-clamp-2">
                      {toilet.address}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cleanBadge.bg}`}>
                      {cleanBadge.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${operBadge.bg}`}>
                      {operBadge.label}
                    </span>
                    {toilet.distance_km !== undefined && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {formatDistance(toilet.distance_km)}
                      </span>
                    )}
                  </div>
                  <div className="pt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectToilet(toilet)}
                      className="flex-1 py-1 px-2 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToilet(toilet)}
                      className="flex-1 py-1 px-2 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      Navigate
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        <RecenterButton userCoords={userCoords} onRecenterUser={onRecenterUser} />
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute top-3 left-14 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs hidden sm:flex items-center gap-3 text-[11px] text-slate-600">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>Clean</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
          <span>Dirty/Unusable</span>
        </div>
      </div>
    </div>
  )
}
