export type UserRole = 'citizen' | 'authority'

export type CleanlinessStatus = 'clean' | 'moderate' | 'dirty' | 'unusable'
export type OperationalStatus = 'operational' | 'maintenance' | 'closed'
export type ComplaintCategory = 'cleanliness' | 'damage' | 'water_supply' | 'lighting' | 'safety' | 'other'
export type ComplaintStatus = 'submitted' | 'in_progress' | 'resolved' | 'rejected'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Toilet {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  address: string | null
  cleanliness_status: CleanlinessStatus
  operational_status: OperationalStatus
  facilities: string[]
  source_type?: string
  created_at: string
  updated_at: string
  distance_km?: number
}

export interface Complaint {
  id: string
  toilet_id: string
  citizen_id: string
  category: ComplaintCategory
  description: string
  status: ComplaintStatus
  authority_notes: string | null
  citizen_confirmed?: boolean | null
  citizen_feedback?: string | null
  created_at: string
  updated_at: string
}

export interface ComplaintWithToilet extends Complaint {
  toilets?: {
    name: string
    address: string | null
  } | null
}

export interface ToiletReview {
  id: string
  toilet_id: string
  citizen_id: string
  overall_rating: number
  cleanliness_rating?: number | null
  water_rating?: number | null
  soap_rating?: number | null
  condition_rating?: number | null
  lighting_rating?: number | null
  safety_rating?: number | null
  accessibility_rating?: number | null
  review_text?: string | null
  created_at: string
  updated_at: string
}

export interface AuthorityToiletSummary {
  id: string
  name: string
  address: string | null
  operational_status: OperationalStatus
  cleanliness_status: CleanlinessStatus
}

export interface FacilityReportStats {
  toiletId: string
  toiletName: string
  address: string | null
  totalComplaints: number
  unresolvedComplaints: number
}

