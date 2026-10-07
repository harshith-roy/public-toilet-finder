import L from 'leaflet'

// Fix default Leaflet icon paths in Vite / React
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Static Singleton user location marker icon
export const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
      <span style="position:absolute;width:100%;height:100%;border-radius:9999px;background-color:#38bdf8;opacity:0.6;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="position:relative;width:20px;height:20px;border-radius:9999px;background-color:#0284c7;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// Static Icon Cache: Strictly memoizes DivIcon instances to ensure stable references across renders.
// This prevents react-leaflet from repeatedly destroying and recreating DOM marker nodes, eliminating jitter/shake.
const toiletIconCache = new Map<string, L.DivIcon>()

export const getToiletIcon = (cleanliness: string, isSelected: boolean = false): L.DivIcon => {
  const normCleanliness = ['clean', 'moderate', 'dirty', 'unusable'].includes(cleanliness)
    ? cleanliness
    : 'clean'
  const key = `${normCleanliness}_${isSelected ? 'selected' : 'normal'}`

  const cached = toiletIconCache.get(key)
  if (cached) return cached

  let bgColor = '#059669' // emerald-600
  let strokeColor = '#047857' // emerald-700

  if (normCleanliness === 'moderate') {
    bgColor = '#d97706' // amber-600
    strokeColor = '#b45309' // amber-700
  } else if (normCleanliness === 'dirty' || normCleanliness === 'unusable') {
    bgColor = '#dc2626' // red-600
    strokeColor = '#b91c1c' // red-700
  }

  // Stable CSS: Uses box-shadow outline rather than scale/transitions to keep Leaflet translate3d stable
  const shadow = isSelected
    ? 'box-shadow: 0 0 0 4px #38bdf8, 0 6px 14px rgba(0,0,0,0.35);'
    : 'box-shadow: 0 2px 6px rgba(0,0,0,0.28);'

  const icon = L.divIcon({
    className: 'custom-toilet-marker-pin',
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background-color:${bgColor};color:white;border-radius:9999px;border:2.5px solid ${strokeColor};${shadow};cursor:pointer;pointer-events:auto;user-select:none;">
        <svg style="width:18px;height:18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5" />
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  })

  toiletIconCache.set(key, icon)
  return icon
}
