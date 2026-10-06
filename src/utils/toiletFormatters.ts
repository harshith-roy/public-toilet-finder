export const formatDistance = (distanceKm?: number): string => {
  if (distanceKm === undefined || distanceKm === null) return '--'
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(2)} km`
}

export const getCleanlinessBadge = (status: string) => {
  switch (status) {
    case 'clean':
      return { label: 'Clean', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    case 'moderate':
      return { label: 'Moderate', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'dirty':
      return { label: 'Dirty', bg: 'bg-orange-100 text-orange-800 border-orange-200' }
    case 'unusable':
      return { label: 'Unusable', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

export const getOperationalBadge = (status: string) => {
  switch (status) {
    case 'operational':
      return { label: 'Operational', bg: 'bg-sky-100 text-sky-800 border-sky-200' }
    case 'maintenance':
      return { label: 'In Maintenance', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'closed':
      return { label: 'Closed', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

export const getComplaintCategoryLabel = (category: string) => {
  switch (category) {
    case 'cleanliness':
      return 'Cleanliness & Hygiene'
    case 'damage':
      return 'Physical Damage'
    case 'water_supply':
      return 'Water Supply & Plumbing'
    case 'lighting':
      return 'Lighting & Electrical'
    case 'safety':
      return 'Safety & Security'
    case 'other':
      return 'Other Issue'
    default:
      return category
  }
}

export const getComplaintStatusBadge = (status: string) => {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted', bg: 'bg-sky-100 text-sky-800 border-sky-200' }
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'resolved':
      return { label: 'Resolved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    case 'rejected':
      return { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

export const formatComplaintDate = (isoString?: string) => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}
