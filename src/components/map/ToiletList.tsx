import React, { useState, useMemo } from 'react'
import type { Toilet } from '../../types'
import { RADIUS_OPTIONS, type RadiusOption } from '../../hooks/useNearbyToilets'
import type { Coordinates, GeolocationStatus } from '../../hooks/useGeolocation'
import { ToiletCard } from './ToiletCard'

interface ToiletListProps {
  toilets: Toilet[]
  loadingToilets: boolean
  locatingUser: boolean
  locationStatus?: GeolocationStatus
  toiletError: string | null
  locationError: { message: string; isDenied: boolean } | null
  userCoords: Coordinates | null
  radiusKm: RadiusOption
  selectedToilet: Toilet | null
  onSelectToilet: (toilet: Toilet) => void
  onNavigateToilet: (toilet: Toilet) => void
  onChangeRadius: (radius: RadiusOption) => void
  onRefreshLocation: () => void
}

export const ToiletList: React.FC<ToiletListProps> = ({
  toilets,
  loadingToilets,
  locatingUser,
  locationStatus,
  toiletError,
  locationError,
  userCoords,
  radiusKm,
  selectedToilet,
  onSelectToilet,
  onNavigateToilet,
  onChangeRadius,
  onRefreshLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Requirement 10: Filter ONLY the currently loaded Supabase results by toilet name/address
  const filteredToilets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return toilets

    return toilets.filter((toilet) => {
      const nameMatch = toilet.name.toLowerCase().includes(query)
      const addressMatch = toilet.address ? toilet.address.toLowerCase().includes(query) : false
      return nameMatch || addressMatch
    })
  }, [toilets, searchQuery])

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Search & Location Bar */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="toilet-search"
            name="toiletSearch"
            type="text"
            aria-label="Search loaded toilets by name or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search loaded toilets by name or address..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Radius Buttons & Use Location */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Radius Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Radius:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChangeRadius(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    radiusKm === r
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Refresh / Use My Location Button */}
          <button
            type="button"
            onClick={onRefreshLocation}
            disabled={locatingUser}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Update your current browser location and re-query nearby toilets"
          >
            <svg
              className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{locatingUser ? 'Locating...' : 'Refresh Location'}</span>
          </button>
        </div>

        {/* Status Indicator Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 truncate">
            {userCoords && !(Math.abs(userCoords.latitude) < 0.0001 && Math.abs(userCoords.longitude) < 0.0001) ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-mono text-[10px] text-slate-600 truncate">
                  GPS: {userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)}
                  {userCoords.accuracy > 0 ? ` (±${Math.round(userCoords.accuracy)}m)` : ''}
                </span>
              </>
            ) : locatingUser ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                <span>
                  {locationStatus === 'prompt' ? 'Waiting for GPS permission...' : 'Detecting GPS location...'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                <span>Location not detected</span>
              </>
            )}
          </div>

          <span className="shrink-0 font-medium text-slate-700">
            {filteredToilets.length} {filteredToilets.length === 1 ? 'toilet' : 'toilets'}
          </span>
        </div>
      </div>

      {/* Main List & States Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* STATE: Location Permission Denied */}
        {locationError?.isDenied && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-rose-900">Location Permission Required</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">
                  {locationError.message}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRefreshLocation}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Retry Location
              </button>
            </div>
          </div>
        )}

        {/* STATE: General Location Error (Non-denial) */}
        {locationError && !locationError.isDenied && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">{locationError.message}</p>
              <button
                type="button"
                onClick={onRefreshLocation}
                className="mt-1 text-amber-800 underline font-semibold cursor-pointer"
              >
                Click to retry
              </button>
            </div>
          </div>
        )}

        {/* STATE: Supabase Query Error */}
        {toiletError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold text-red-900">Database Query Error</p>
                <p className="text-red-700">{toiletError}</p>
              </div>
            </div>
          </div>
        )}

        {/* STATE: Locating User */}
        {locatingUser && (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-700">Detecting your location...</p>
            <p className="text-[11px] text-slate-400">Allow location access in your browser when prompted.</p>
          </div>
        )}

        {/* STATE: Loading Toilets */}
        {!locatingUser && loadingToilets && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <svg className="w-4 h-4 animate-spin text-emerald-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Searching toilets within {radiusKm} km...</span>
              </div>
            </div>
            {/* Skeletons */}
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* STATE: No Toilets Nearby (Supabase returned 0 rows) */}
        {!locatingUser && !loadingToilets && !toiletError && toilets.length === 0 && userCoords && (
          <div className="p-6 bg-white border border-slate-200 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">No Toilets Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No public toilets found within {radiusKm} km of your current location.
              </p>
            </div>
            {radiusKm < 10 && (
              <button
                type="button"
                onClick={() => onChangeRadius(10)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-300 transition-colors cursor-pointer"
              >
                Expand Radius to 10 km
              </button>
            )}
          </div>
        )}

        {/* STATE: No Search Results (Filter eliminated all loaded toilets) */}
        {!locatingUser && !loadingToilets && toilets.length > 0 && filteredToilets.length === 0 && (
          <div className="p-6 bg-white border border-slate-200 rounded-xl text-center space-y-2">
            <svg className="w-8 h-8 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h4 className="font-bold text-sm text-slate-700">No matching search results</h4>
            <p className="text-xs text-slate-400">
              No toilets in the current {radiusKm} km radius match &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* LIST: Loaded & Filtered Toilets */}
        {!loadingToilets &&
          filteredToilets.map((toilet) => (
            <ToiletCard
              key={toilet.id}
              toilet={toilet}
              isSelected={selectedToilet?.id === toilet.id}
              onSelect={onSelectToilet}
              onNavigate={(t, e) => {
                e.stopPropagation()
                onNavigateToilet(t)
              }}
            />
          ))}
      </div>
    </div>
  )
}
