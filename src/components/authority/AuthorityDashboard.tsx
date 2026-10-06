import React, { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAuthorityComplaints } from '../../hooks/useAuthorityComplaints'
import { ComplaintDetailModal } from './ComplaintDetailModal'
import { OperationsAnalytics } from './OperationsAnalytics'
import { RecentActivityFeed } from './RecentActivityFeed'
import type { ComplaintWithToilet, ComplaintStatus } from '../../types'
import {
  getComplaintCategoryLabel,
  getComplaintStatusBadge,
  formatComplaintDate,
} from '../../utils/toiletFormatters'

interface AuthorityDashboardProps {
  onSwitchToCitizenView: () => void
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  onSwitchToCitizenView,
}) => {
  const { user, profile, signOut } = useAuth()
  const {
    toilets,
    complaints,
    loading,
    error,
    refreshComplaints,
    updateComplaint,
  } = useAuthorityComplaints()

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithToilet | null>(null)

  // Toilet metrics computed directly from real Supabase toilets
  const toiletMetrics = useMemo(() => {
    const total = toilets.length
    const operational = toilets.filter((t) => t.operational_status === 'operational').length
    const rate = total > 0 ? Math.round((operational / total) * 100) : 0
    return { total, operational, rate }
  }, [toilets])

  // Real summary counts computed directly from live Supabase complaints
  const summaryCounts = useMemo(() => {
    const total = complaints.length
    const submitted = complaints.filter((c) => c.status === 'submitted').length
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length
    const resolved = complaints.filter((c) => c.status === 'resolved').length
    const rejected = complaints.filter((c) => c.status === 'rejected').length
    return { total, submitted, inProgress, resolved, rejected }
  }, [complaints])

  const openComplaintsCount = useMemo(() => {
    return summaryCounts.submitted + summaryCounts.inProgress
  }, [summaryCounts])

  // Filtered complaints based on status, category, and search query
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false
      }

      // Category filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const toiletName = c.toilets?.name?.toLowerCase() || ''
        const toiletAddress = c.toilets?.address?.toLowerCase() || ''
        const desc = c.description.toLowerCase()
        const match =
          toiletName.includes(q) || toiletAddress.includes(q) || desc.includes(q)
        if (!match) return false
      }

      return true
    })
  }, [complaints, statusFilter, categoryFilter, searchQuery])

  // Handle saving updates from detail modal
  const handleUpdate = async (
    complaintId: string,
    status: ComplaintStatus,
    notes: string | null
  ) => {
    const res = await updateComplaint(complaintId, status, notes)
    if (res.success && res.complaint) {
      setSelectedComplaint(res.complaint)
    }
    return res
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Top Authority Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Authority Dashboard
              </h1>
              <span className="bg-purple-100 text-purple-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full border border-purple-200 tracking-wider">
                {profile?.role || 'Authority'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Smart City Public Sanitation & Complaint Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Navigation to Citizen Map */}
          <button
            type="button"
            onClick={onSwitchToCitizenView}
            className="text-xs px-3 py-1.5 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Switch to Citizen Map & Navigation"
          >
            <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="hidden sm:inline">Citizen Map View</span>
            <span className="sm:hidden">Map</span>
          </button>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800">
              {profile?.full_name || 'Officer Authority'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
              {user?.email}
            </span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="text-xs px-2.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Sign out"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={refreshComplaints}
              className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-800 font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Section B: Operations Overview Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Toilets
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {toiletMetrics.total}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                Assets
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Operational
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                {toiletMetrics.operational}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                {toiletMetrics.rate}% Active
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Complaints
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {summaryCounts.total}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">All Time</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Open Reports
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                {openComplaintsCount}
              </span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                Unresolved
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Resolved
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                {summaryCounts.resolved}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                Closed
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Rejected
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-700">
                {summaryCounts.rejected}
              </span>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                Invalid
              </span>
            </div>
          </div>
        </section>

        {/* Section C: Operations Analytics (Category Breakdown, Most Reported, Insights & Resolution Turnaround) */}
        <section>
          <OperationsAnalytics toilets={toilets} complaints={complaints} />
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="authority-search"
                name="authoritySearch"
                type="text"
                aria-label="Search by facility name, address, or complaint description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by facility name, address, or complaint description..."
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search text"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Select & Refresh Button */}
            <div className="flex items-center gap-2">
              <select
                id="authority-category-filter"
                name="categoryFilter"
                aria-label="Filter complaints by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="cleanliness">Cleanliness & Hygiene</option>
                <option value="damage">Physical Damage</option>
                <option value="water_supply">Water Supply & Plumbing</option>
                <option value="lighting">Lighting & Electrical</option>
                <option value="safety">Safety & Security</option>
                <option value="other">Other Issue</option>
              </select>

              <button
                type="button"
                onClick={refreshComplaints}
                disabled={loading}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh complaints list"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Status:
            </span>
            {[
              { id: 'all', label: 'All', count: summaryCounts.total },
              { id: 'submitted', label: 'Submitted', count: summaryCounts.submitted },
              { id: 'in_progress', label: 'In Progress', count: summaryCounts.inProgress },
              { id: 'resolved', label: 'Resolved', count: summaryCounts.resolved },
              { id: 'rejected', label: 'Rejected', count: summaryCounts.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id
                      ? 'bg-purple-800 text-purple-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Complaints Data Display */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-600">Loading complaints from municipal database...</p>
            </div>
          )}

          {/* Empty State: No complaints in database */}
          {!loading && complaints.length === 0 && (
            <div className="py-16 text-center space-y-3 p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-700">No Citizen Complaints Registered</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No complaints have been reported by citizens yet. Once submitted, citizen problem reports will appear here for management.
              </p>
            </div>
          )}

          {/* Empty State: Filter eliminated all matches */}
          {!loading && complaints.length > 0 && filteredComplaints.length === 0 && (
            <div className="py-14 text-center space-y-2 p-6">
              <svg className="w-8 h-8 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h4 className="font-bold text-sm text-slate-700">No Matching Complaints</h4>
              <p className="text-xs text-slate-400">
                No complaint matches your active filter or search criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setCategoryFilter('all')
                  setSearchQuery('')
                }}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* DESKTOP TABLE VIEW */}
          {!loading && filteredComplaints.length > 0 && (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Facility & Address</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Problem Description</th>
                    <th className="py-3 px-4">Citizen Ref</th>
                    <th className="py-3 px-4">Reported</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((c) => {
                    const statusBadge = getComplaintStatusBadge(c.status)
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedComplaint(c)}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="font-bold text-slate-900 truncate">
                            {c.toilets?.name || 'Public Facility'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {c.toilets?.address || '—'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                          {getComplaintCategoryLabel(c.category)}
                        </td>
                        <td className="py-3.5 px-4 max-w-[260px]">
                          <p className="line-clamp-2 text-slate-700">{c.description}</p>
                          {c.authority_notes && (
                            <p className="text-[10px] text-purple-700 font-medium truncate mt-0.5">
                              Notes: {c.authority_notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {c.citizen_id.slice(0, 8)}...
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {formatComplaintDate(c.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedComplaint(c)
                            }}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* MOBILE / TABLET CARD LIST VIEW */}
          {!loading && filteredComplaints.length > 0 && (
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredComplaints.map((c) => {
                const statusBadge = getComplaintStatusBadge(c.status)
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className="p-4 space-y-2 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {c.toilets?.name || 'Public Facility'}
                        </h4>
                        {c.toilets?.address && (
                          <p className="text-[11px] text-slate-400">{c.toilets.address}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700">
                        {getComplaintCategoryLabel(c.category)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Citizen {c.citizen_id.slice(0, 8)}...
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3">
                      {c.description}
                    </p>

                    {c.authority_notes && (
                      <div className="p-2 bg-purple-50/70 border border-purple-100 rounded-lg text-[11px] text-purple-900">
                        <span className="font-bold">Authority Note: </span>
                        <span>{c.authority_notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>{formatComplaintDate(c.created_at)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedComplaint(c)
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md font-semibold text-xs shadow-2xs"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Section F: Recent Maintenance Activity */}
        <section>
          <RecentActivityFeed
            complaints={complaints}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
          />
        </section>
      </main>

      {/* Edit/Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          key={selectedComplaint.id}
          complaint={selectedComplaint}
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
