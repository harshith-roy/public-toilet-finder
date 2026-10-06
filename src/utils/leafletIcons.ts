import L from 'leaflet'

// Fix default Leaflet icon paths in Vite / React
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom SVG-based Markers for distinct visual presentation
export const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-5 w-5 bg-sky-500 border-2 border-white shadow-md"></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export const getToiletIcon = (cleanliness: string, isSelected: boolean = false) => {
  let bgColor = 'bg-emerald-600'
  let strokeColor = 'border-emerald-700'

  if (cleanliness === 'moderate') {
    bgColor = 'bg-amber-500'
    strokeColor = 'border-amber-600'
  } else if (cleanliness === 'dirty' || cleanliness === 'unusable') {
    bgColor = 'bg-red-600'
    strokeColor = 'border-red-700'
  }

  const ringClass = isSelected ? 'ring-4 ring-sky-400 scale-110 z-50' : 'hover:scale-105'

  return L.divIcon({
    className: `custom-toilet-marker ${ringClass}`,
    html: `
      <div class="flex items-center justify-center w-9 h-9 ${bgColor} text-white rounded-full border-2 ${strokeColor} shadow-lg transition-transform">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5" />
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}
