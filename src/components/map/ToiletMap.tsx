import React, { useEffect } from 'react'
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
  onSelectToilet: (toilet: Toilet) => void
  onNavigateToilet: (toilet: Toilet) => void
  onRecenterUser: () => void
}

// Controller component to smoothly fly/pan map when coordinates or selection change
const MapViewController: React.FC<{
  userCoords: Coordinates | null
  selectedToilet: Toilet | null
}> = ({ userCoords, selectedToilet }) => {
  const map = useMap()

  useEffect(() => {
    // Invalidate size in case parent container sized asynchronously
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)
    return () => clearTimeout(timer)
  }, [map])

  useEffect(() => {
    if (selectedToilet) {
      map.flyTo([selectedToilet.latitude, selectedToilet.longitude], 16, {
        animate: true,
        duration: 0.8,
      })
    } else if (userCoords) {
      map.flyTo([userCoords.latitude, userCoords.longitude], 14, {
        animate: true,
        duration: 0.8,
      })
    }
  }, [map, userCoords, selectedToilet])

  return null
}

export const ToiletMap: React.FC<ToiletMapProps> = ({
  userCoords,
  toilets,
  selectedToilet,
  radiusKm,
  onSelectToilet,
  onNavigateToilet,
  onRecenterUser,
}) => {
  // Neutral fallback map center before GPS coordinates arrive
  const defaultCenter: [number, number] = userCoords
    ? [userCoords.latitude, userCoords.longitude]
    : [20.5937, 78.9629]

  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-100 overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={userCoords ? 14 : 5}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapViewController userCoords={userCoords} selectedToilet={selectedToilet} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Marker & Radius Circle */}
        {userCoords && (
          <>
            <Marker
              position={[userCoords.latitude, userCoords.longitude]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-slate-800">Your Current Location</p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[userCoords.latitude, userCoords.longitude]}
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

        {/* Toilet Markers */}
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
                click: () => onSelectToilet(toilet),
              }}
            >
              <Popup>
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
                      className="flex-1 py-1 px-2 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToilet(toilet)}
                      className="flex-1 py-1 px-2 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                    >
                      Navigate
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Floating Recenter Map Button */}
      {userCoords && (
        <button
          type="button"
          onClick={onRecenterUser}
          className="absolute bottom-4 right-4 z-20 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs px-3 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          title="Center map on your location"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span>Center My Location</span>
        </button>
      )}

      {/* Map Legend */}
      <div className="absolute top-3 left-14 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs hidden sm:flex items-center gap-3 text-[11px] text-slate-600">
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
