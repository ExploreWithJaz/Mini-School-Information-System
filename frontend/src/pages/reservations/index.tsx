'use client'
import { useEffect, useState } from 'react'
import { apiCall } from '@/lib/api'
import Modal from '@/components/modal'

interface Reservation {
  id: string
  studentID: string
  subjectID: string
  reservedAt: string
  status: 'reserved' | 'cancelled'
}

interface Student {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  courseId: string
}

interface Subject {
  id: string
  code: string
  title: string
  units: number
  courseId: string
}

interface ReservationDetail extends Reservation {
  student?: Student
  subject?: Subject
  prerequisitesMet?: boolean
  prerequisites?: { id: string; code: string; title: string }[]
}

export default function Reservations() {
  const [reservations, setReservations] = useState<ReservationDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'reserved' | 'cancelled'>('all')

  const [selectedReservation, setSelectedReservation] = useState<ReservationDetail | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isActionOpen, setIsActionOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch all reservations with related data
  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)

      const reservationsResponse = await apiCall('/subject-reservations')
      const studentsResponse = await apiCall('/students')
      const subjectsResponse = await apiCall('/subjects')
      const prerequisitesResponse = await apiCall('/subject-prerequisites')

      const students = studentsResponse.data || studentsResponse
      const subjects = subjectsResponse.data || subjectsResponse
      const prerequisites = prerequisitesResponse || []

      const enrichedReservations: ReservationDetail[] = (
        Array.isArray(reservationsResponse) ? reservationsResponse : reservationsResponse.data || []
      ).map((res: any) => {
        const student = students.find((s: any) => s.id === res.studentID)
        const subject = subjects.find((subj: any) => subj.id === res.subjectID)

        // Get prerequisites for this subject
        const subjectPrereqs = prerequisites.filter((p: any) => p.subject_id === res.subjectID || p.subjectID === res.subjectID)
        
        return {
          ...res,
          student,
          subject,
          prerequisites: subjectPrereqs.map((p: any) => ({
            id: p.prerequisite_subject_id || p.prerequisiteSubjectID,
            code: subjects.find((s: any) => (s.id === p.prerequisite_subject_id || s.id === p.prerequisiteSubjectID))?.code || 'N/A',
            title: subjects.find((s: any) => (s.id === p.prerequisite_subject_id || s.id === p.prerequisiteSubjectID))?.title || 'N/A'
          }))
        }
      })

      setReservations(enrichedReservations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reservations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  // Filter reservations based on search and status
  const filteredReservations = reservations.filter((res) => {
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter
    const searchLower = search.toLowerCase()
    const matchesSearch =
      res.student?.firstName.toLowerCase().includes(searchLower) ||
      res.student?.lastName.toLowerCase().includes(searchLower) ||
      res.student?.studentNumber.toLowerCase().includes(searchLower) ||
      res.student?.email.toLowerCase().includes(searchLower) ||
      res.subject?.code.toLowerCase().includes(searchLower) ||
      res.subject?.title.toLowerCase().includes(searchLower)

    return matchesStatus && matchesSearch
  })

  const openDetailsModal = (reservation: ReservationDetail) => {
    setSelectedReservation(reservation)
    setIsDetailsOpen(true)
  }

  const openActionModal = (reservation: ReservationDetail, type: 'approve' | 'reject') => {
    setSelectedReservation(reservation)
    setActionType(type)
    setIsActionOpen(true)
  }

  const handleApproveReservation = async () => {
    if (!selectedReservation) return

    try {
      setIsProcessing(true)
      setError(null)

      await apiCall(`/subject-reservations/${selectedReservation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'reserved' })
      })

      setReservations((prev) =>
        prev.map((res) =>
          res.id === selectedReservation.id ? { ...res, status: 'reserved' } : res
        )
      )

      setIsActionOpen(false)
      setSelectedReservation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve reservation')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectReservation = async () => {
    if (!selectedReservation) return

    try {
      setIsProcessing(true)
      setError(null)

      await apiCall(`/subject-reservations/${selectedReservation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' })
      })

      setReservations((prev) =>
        prev.map((res) =>
          res.id === selectedReservation.id ? { ...res, status: 'cancelled' } : res
        )
      )

      setIsActionOpen(false)
      setSelectedReservation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject reservation')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (date: string) => {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime())
      ? 'N/A'
      : parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-green-50 text-green-700 border-green-100'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100'
    }
  }

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Subject Reservations</h1>
        <p className='text-gray-500'>Manage student subject reservations and prerequisites verification</p>
      </div>

      {/* Search and Filter Bar */}
      <div className='bg-white p-5 rounded-xl border border-gray-100 mb-5 flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Search Reservations</label>
          <input
            type='text'
            placeholder='Search by student name, ID, email, or subject...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
          />
        </div>
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className='w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
          >
            <option value='all'>All Statuses</option>
            <option value='reserved'>Reserved</option>
            <option value='cancelled'>Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className='mb-5 bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-700 text-sm font-medium'>{error}</p>
        </div>
      )}

      {/* Reservations Table */}
      <div className='bg-white rounded-xl border border-gray-100 overflow-hidden'>
        {loading ? (
          <div className='flex items-center justify-center p-10'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4'></div>
              <p className='text-gray-500'>Loading reservations...</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className='flex items-center justify-center p-10'>
            <div className='text-center'>
              <svg
                className='w-12 h-12 text-gray-300 mx-auto mb-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
              </svg>
              <p className='text-gray-500 font-medium'>No reservations found</p>
              <p className='text-gray-400 text-sm'>Try adjusting your search or filter</p>
            </div>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>
                    Student
                  </th>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>
                    Subject
                  </th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>
                    Reserved Date
                  </th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>
                    Prerequisites
                  </th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>
                    Status
                  </th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation, idx) => (
                  <tr
                    key={reservation.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      idx < filteredReservations.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <td className='px-6 py-3.5'>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {reservation.student?.firstName} {reservation.student?.lastName}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {reservation.student?.studentNumber} • {reservation.student?.email}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-3.5'>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>{reservation.subject?.code}</p>
                        <p className='text-xs text-gray-500'>{reservation.subject?.title}</p>
                      </div>
                    </td>
                    <td className='px-6 py-3.5 text-center'>
                      <span className='text-sm text-gray-700'>{formatDate(reservation.reservedAt)}</span>
                    </td>
                    <td className='px-6 py-3.5 text-center'>
                      {reservation.prerequisites && reservation.prerequisites.length > 0 ? (
                        <span className='inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100'>
                          <span>{reservation.prerequisites.length} required</span>
                        </span>
                      ) : (
                        <span className='text-xs text-gray-500'>None</span>
                      )}
                    </td>
                    <td className='px-6 py-3.5 text-center'>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusBadgeColor(
                          reservation.status
                        )}`}
                      >
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                    </td>
                    <td className='px-6 py-3.5 text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <button
                          onClick={() => openDetailsModal(reservation)}
                          className='text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
                        >
                          View
                        </button>
                        {reservation.status === 'reserved' && (
                          <button
                            onClick={() => openActionModal(reservation, 'reject')}
                            className='text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors'
                          >
                            Cancel
                          </button>
                        )}
                        {reservation.status !== 'reserved' && (
                          <button
                            onClick={() => openActionModal(reservation, 'approve')}
                            className='text-xs font-medium px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors'
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedReservation(null)
        }}
        title='Reservation Details'
        size='lg'
      >
        {selectedReservation && (
          <div className='space-y-6'>
            {/* Student Information */}
            <div className='border-b border-slate-200 pb-4'>
              <h3 className='text-sm font-semibold text-slate-900 mb-3'>Student Information</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Full Name</p>
                  <p className='text-sm font-medium text-slate-800'>
                    {selectedReservation.student?.firstName} {selectedReservation.student?.lastName}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Student ID</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedReservation.student?.studentNumber}</p>
                </div>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Email</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedReservation.student?.email}</p>
                </div>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Reserved Date</p>
                  <p className='text-sm font-medium text-slate-800'>{formatDate(selectedReservation.reservedAt)}</p>
                </div>
              </div>
            </div>

            {/* Subject Information */}
            <div className='border-b border-slate-200 pb-4'>
              <h3 className='text-sm font-semibold text-slate-900 mb-3'>Subject Information</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Subject Code</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedReservation.subject?.code}</p>
                </div>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Units</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedReservation.subject?.units}</p>
                </div>
                <div className='col-span-2'>
                  <p className='text-xs text-slate-500 mb-1'>Subject Title</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedReservation.subject?.title}</p>
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            {selectedReservation.prerequisites && selectedReservation.prerequisites.length > 0 && (
              <div>
                <h3 className='text-sm font-semibold text-slate-900 mb-3'>
                  Prerequisites ({selectedReservation.prerequisites.length})
                </h3>
                <div className='space-y-2'>
                  {selectedReservation.prerequisites.map((prereq) => (
                    <div key={prereq.id} className='flex items-start gap-3 p-3 bg-slate-50 rounded-lg'>
                      <svg
                        className='w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' />
                      </svg>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-slate-900'>{prereq.code}</p>
                        <p className='text-xs text-slate-600'>{prereq.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={isActionOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsActionOpen(false)
            setSelectedReservation(null)
          }
        }}
        title={actionType === 'approve' ? 'Approve Reservation' : 'Reject Reservation'}
        size='sm'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (!isProcessing) {
                  setIsActionOpen(false)
                  setSelectedReservation(null)
                }
              }}
              disabled={isProcessing}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={actionType === 'approve' ? handleApproveReservation : handleRejectReservation}
              disabled={isProcessing}
              className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {isProcessing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        }
      >
        <p className='text-sm text-slate-600'>
          {actionType === 'approve'
            ? `Are you sure you want to approve the reservation for ${selectedReservation?.subject?.code}? The student will be able to enroll in this subject.`
            : `Are you sure you want to reject the reservation for ${selectedReservation?.subject?.code}? The student will need to re-submit if they wish to enroll.`}
        </p>
      </Modal>
    </section>
  )
}