import React, { useState, useCallback } from 'react'
import { Header } from '../common/Header'
import { ToiletMap } from './ToiletMap'
import { ToiletList } from './ToiletList'
import { ToiletDetailModal } from './ToiletDetailModal'
import { ComplaintModal } from '../complaints/ComplaintModal'
import { MyComplaintsModal } from '../complaints/MyComplaintsModal'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useNearbyToilets, type RadiusOption } from '../../hooks/useNearbyToilets'
import { useComplaints } from '../../hooks/useComplaints'
import type { Toilet } from '../../types'

interface CitizenMapViewProps {
  onSwitchToAuthority?: () => void
}

export const CitizenMapView: React.FC<CitizenMapViewProps> = ({ onSwitchToAuthority }) => {
  const {
    coords: userCoords,
    loading: locatingUser,
    error: locationError,
    refreshLocation,
  } = useGeolocation()

  const {
    toilets,
    loading: loadingToilets,
    error: toiletError,
    radiusKm,
    setRadiusKm,
    refetchToilets,
  } = useNearbyToilets(userCoords)

  const {
    complaints,
    loading: complaintsLoading,
    error: complaintsError,
    refreshComplaints,
    submitComplaint,
    confirmResolution,
  } = useComplaints()

  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [reportingToilet, setReportingToilet] = useState<Toilet | null>(null)
  const [myComplaintsOpen, setMyComplaintsOpen] = useState(false)

  // Handle toilet selection from map marker or card list
  const handleSelectToilet = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet)
    setDetailModalOpen(true)
  }, [])

  // External Navigation using selected toilet's real coordinates
  const handleNavigateToilet = useCallback((toilet: Toilet) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${toilet.latitude},${toilet.longitude}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  // Handle radius option change
  const handleChangeRadius = useCallback((r: RadiusOption) => {
    setRadiusKm(r)
  }, [setRadiusKm])

  // Handle Refresh Location / Use My Location
  const handleRefreshLocation = useCallback(() => {
    refreshLocation()
  }, [refreshLocation])

  // Recenter map on user location
  const handleRecenterUser = useCallback(() => {
    setSelectedToilet(null)
    if (userCoords) {
      refetchToilets()
    }
  }, [userCoords, refetchToilets])

  // Handle opening problem reporting modal
  const handleOpenReportProblem = useCallback((toilet: Toilet) => {
    setDetailModalOpen(false)
    setReportingToilet(toilet)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100">
      {/* Top Application Header */}
      <Header
        onOpenMyComplaints={() => setMyComplaintsOpen(true)}
        complaintCount={complaints.length}
        onSwitchToAuthority={onSwitchToAuthority}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* On Mobile: Map Prominent (top/half), On Desktop: Right Side */}
        <div className="order-1 md:order-2 flex-1 h-[45vh] md:h-full relative z-0">
          <ToiletMap
            userCoords={userCoords}
            toilets={toilets}
            selectedToilet={selectedToilet}
            radiusKm={radiusKm}
            onSelectToilet={handleSelectToilet}
            onNavigateToilet={handleNavigateToilet}
            onRecenterUser={handleRecenterUser}
          />
        </div>

        {/* On Mobile: Toilet Cards List below map, On Desktop: Left Sidebar (side-by-side) */}
        <div className="order-2 md:order-1 w-full md:w-[420px] lg:w-[460px] h-[55vh] md:h-full shrink-0 z-10 shadow-lg md:shadow-none">
          <ToiletList
            toilets={toilets}
            loadingToilets={loadingToilets}
            locatingUser={locatingUser}
            toiletError={toiletError}
            locationError={locationError}
            userCoords={userCoords}
            radiusKm={radiusKm}
            selectedToilet={selectedToilet}
            onSelectToilet={handleSelectToilet}
            onNavigateToilet={handleNavigateToilet}
            onChangeRadius={handleChangeRadius}
            onRefreshLocation={handleRefreshLocation}
          />
        </div>
      </div>

      {/* Selected Toilet Full Details Modal */}
      {detailModalOpen && (
        <ToiletDetailModal
          toilet={selectedToilet}
          onClose={() => setDetailModalOpen(false)}
          onReportProblem={handleOpenReportProblem}
        />
      )}

      {/* Report Problem Complaint Modal */}
      <ComplaintModal
        toilet={reportingToilet}
        isOpen={!!reportingToilet}
        onClose={() => setReportingToilet(null)}
        onSubmit={submitComplaint}
      />

      {/* My Complaints Status Tracker Modal */}
      <MyComplaintsModal
        complaints={complaints}
        loading={complaintsLoading}
        error={complaintsError}
        isOpen={myComplaintsOpen}
        onClose={() => setMyComplaintsOpen(false)}
        onRefresh={refreshComplaints}
        onConfirmResolution={confirmResolution}
      />
    </div>
  )
}
