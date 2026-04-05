'use client'
import { useAuth } from '@/context/authContext'
import { useEffect, useState } from 'react'
import { apiCall } from '@/lib/api'
import Modal from '@/components/modal'

interface StudentInfo {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  courseId: string
}

interface Course {
  id: string
  code: string
  name: string
  description?: string
}

interface Subject {
  id: string
  code: string
  title: string
  units: number
  courseId: string
}

interface Grade {
  id: string
  studentID: string
  subjectID: string
  finalGrade: number
  remarks: string
}

interface Prerequisite {
  id: string
  subjectID: string
  prerequisiteSubjectID: string
}

interface Reservation {
  id: string
  studentID: string
  subjectID: string
  status: 'reserved' | 'cancelled'
  reservedAt: string
}

interface SubjectWithDetails extends Subject {
  prerequisites: Subject[]
  isReserved: boolean
  prerequisitesMet: boolean
  reservationId?: string
}

export default function Enrollment() {
  const { user } = useAuth()
  
  // Student and course data
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [enrolledCourse, setEnrolledCourse] = useState<Course | null>(null)
  
  // Subject data
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<boolean>(true)

  // Modal states
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isReservingOpen, setIsReservingOpen] = useState(false)
  const [isUnreservingOpen, setIsUnreservingOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !user?.email) return

      try {
        setLoading(true)
        setError(null)

        // Fetch all students and find by email
        const allStudentsRes = await apiCall('/students')
        const allStudents = Array.isArray(allStudentsRes) ? allStudentsRes : allStudentsRes.data || []
        
        // Find the current student by matching email
        const currentStudent = allStudents.find(
          (s: any) => (s.email === user.email) || 
                      (s.student_number === user.email) // Also try by student number if provided
        )

        if (!currentStudent) {
          setError(`Student account not found for: ${user.email}. Please contact your administrator.`)
          setLoading(false)
          return
        }

        // Normalize student data
        const normalizedStudent: StudentInfo = {
          id: currentStudent.id,
          studentNumber: currentStudent.student_number || currentStudent.studentNumber,
          firstName: currentStudent.first_name || currentStudent.firstName,
          lastName: currentStudent.last_name || currentStudent.lastName,
          email: currentStudent.email,
          birthDate: currentStudent.birth_date || currentStudent.birthDate,
          courseId: currentStudent.course_id || currentStudent.courseId
        }
        setStudentInfo(normalizedStudent)

        // Fetch courses and find the enrolled course
        const coursesRes = await apiCall('/courses')
        const coursesList = Array.isArray(coursesRes) ? coursesRes : coursesRes.data || []
        
        const studentCourse = coursesList.find((c: any) => c.id === normalizedStudent.courseId)
        if (studentCourse) {
          setEnrolledCourse(studentCourse)
        } else {
          setError('Enrolled course not found. Please contact your administrator.')
          setLoading(false)
          return
        }

        // Fetch other data in parallel
        const [subjectsRes, gradesRes, prereqRes, reservationsRes] = await Promise.all([
          apiCall('/subjects'),
          apiCall('/grades'),
          apiCall('/subject-prerequisites'),
          apiCall(`/students/${normalizedStudent.id}/reservations`)
        ])

        // Normalize subjects - map courseID to courseId
        const subjectsList = (Array.isArray(subjectsRes) ? subjectsRes : subjectsRes.data || []).map(
          (s: any) => ({
            id: s.id,
            code: s.code,
            title: s.title,
            units: s.units,
            courseId: s.courseID || s.course_id || s.courseId
          })
        )
        setSubjects(subjectsList)

        // Normalize grades
        const gradesList = (Array.isArray(gradesRes) ? gradesRes : gradesRes.data || []).map(
          (g: any) => ({
            id: g.id,
            studentID: g.studentID || g.student_id,
            subjectID: g.subjectID || g.subject_id,
            finalGrade: g.finalGrade || g.final_grade,
            remarks: g.remarks
          })
        )
        setGrades(gradesList)

        // Normalize prerequisites
        const prereqList = (Array.isArray(prereqRes) ? prereqRes : prereqRes.data || []).map(
          (p: any) => ({
            id: p.id,
            subjectID: p.subjectID || p.subject_id,
            prerequisiteSubjectID: p.prerequisiteSubjectID || p.prerequisite_subject_id
          })
        )
        setPrerequisites(prereqList)

        // Normalize reservations
        const reservationsList = (Array.isArray(reservationsRes) ? reservationsRes : reservationsRes.data || []).map(
          (r: any) => ({
            id: r.id,
            studentID: r.studentID || r.student_id,
            subjectID: r.subjectID || r.subject_id,
            status: r.status,
            reservedAt: r.reservedAt || r.reserved_at
          })
        )
        setReservations(reservationsList)
      } catch (err) {
        console.error('Enrollment data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load enrollment data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, user?.email])

  // Get enriched subjects for the student's course only
  const getEnrichedSubjects = (): SubjectWithDetails[] => {
    if (!studentInfo) return []
    
    return subjects
      .filter((s) => s.courseId === studentInfo.courseId)
      .map((subject) => {
        const subjectPrereqs = prerequisites
          .filter((p) => p.subjectID === subject.id)
          .map((p) => subjects.find((s) => s.id === p.prerequisiteSubjectID))
          .filter(Boolean) as Subject[]

        const prerequisitesMet = subjectPrereqs.every((prereq) =>
          grades.some((g) => g.subjectID === prereq.id && g.studentID === user?.id)
        )

        const reservation = reservations.find((r) => r.subjectID === subject.id && r.status === 'reserved')

        return {
          ...subject,
          prerequisites: subjectPrereqs,
          isReserved: !!reservation,
          prerequisitesMet,
          reservationId: reservation?.id
        }
      })
  }

  const courseSubjects = getEnrichedSubjects()
  const enrolledSubjectsCount = reservations.filter((r) => r.status === 'reserved').length

  const openDetailsModal = (subject: SubjectWithDetails) => {
    setSelectedSubject(subject)
    setIsDetailsOpen(true)
  }

  const openReservingModal = (subject: SubjectWithDetails) => {
    setSelectedSubject(subject)
    setIsReservingOpen(true)
  }

  const openUnreservingModal = (subject: SubjectWithDetails) => {
    setSelectedSubject(subject)
    setIsUnreservingOpen(true)
  }

  const handleReserveSubject = async () => {
    if (!selectedSubject || !user?.id) return

    try {
      setIsProcessing(true)
      setError(null)

      const newReservation = await apiCall(`/students/${user.id}/reservations`, {
        method: 'POST',
        body: JSON.stringify({
          subjectID: selectedSubject.id,
          status: 'reserved'
        })
      })

      setReservations((prev) => [...prev, newReservation])
      setIsReservingOpen(false)
      setSelectedSubject(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reserve subject')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnreserveSubject = async () => {
    if (!selectedSubject || !selectedSubject.reservationId) return

    try {
      setIsProcessing(true)
      setError(null)

      await apiCall(`/students/${selectedSubject.reservationId}/reservations/${selectedSubject.reservationId}`, {
        method: 'DELETE'
      })

      setReservations((prev) => prev.filter((r) => r.id !== selectedSubject.reservationId))
      setIsUnreservingOpen(false)
      setSelectedSubject(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unreserve subject')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Course Enrollment</h1>
        <p className='text-gray-500'>Browse available subjects for your enrolled course</p>
      </div>

      {/* Student Information Card */}
      {studentInfo && (
        <div className='bg-white p-6 rounded-xl border border-gray-100 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div>
              <p className='text-gray-500 text-sm font-medium uppercase tracking-widest mb-2'>Student Number</p>
              <p className='text-lg font-bold text-gray-900'>{studentInfo.studentNumber}</p>
            </div>
            <div>
              <p className='text-gray-500 text-sm font-medium uppercase tracking-widest mb-2'>Full Name</p>
              <p className='text-lg font-bold text-gray-900'>
                {studentInfo.firstName} {studentInfo.lastName}
              </p>
            </div>
            <div>
              <p className='text-gray-500 text-sm font-medium uppercase tracking-widest mb-2'>Email</p>
              <p className='text-sm text-gray-700 break-all'>{studentInfo.email}</p>
            </div>
            {enrolledCourse && (
              <div>
                <p className='text-gray-500 text-sm font-medium uppercase tracking-widest mb-2'>Enrolled Course</p>
                <div>
                  <p className='text-sm font-bold text-gray-900'>{enrolledCourse.code}</p>
                  <p className='text-xs text-gray-600'>{enrolledCourse.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div className='bg-white p-5 rounded-xl border border-gray-100'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm font-medium'>Available Subjects</p>
              <p className='text-2xl font-bold text-gray-900 mt-1'>{courseSubjects.length}</p>
            </div>
            <div className='w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center'>
              <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747 0-6.002-4.5-10.747-10-10.747z' />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white p-5 rounded-xl border border-gray-100'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm font-medium'>Reserved Subjects</p>
              <p className='text-2xl font-bold text-green-600 mt-1'>{enrolledSubjectsCount}</p>
            </div>
            <div className='w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center'>
              <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className='mb-5 bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-700 text-sm font-medium'>{error}</p>
        </div>
      )}

      {loading ? (
        <div className='bg-white rounded-xl border border-gray-100 p-10'>
          <div className='flex items-center justify-center'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4'></div>
              <p className='text-gray-500'>Loading enrollment data...</p>
            </div>
          </div>
        </div>
      ) : enrolledCourse ? (
        <div className='bg-white border border-gray-100 rounded-xl overflow-hidden'>
          {/* Course Header */}
          <button
            onClick={() => setExpandedCourse(!expandedCourse)}
            className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
          >
            <div className='flex flex-col items-start gap-1'>
              <h2 className='text-base font-semibold text-gray-900'>{enrolledCourse.name}</h2>
              {enrolledCourse.description && <p className='text-xs text-gray-400'>{enrolledCourse.description}</p>}
            </div>
            <div className='flex items-center gap-4'>
              <span className='text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100'>
                {enrolledCourse.code}
              </span>
              <span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>
                {courseSubjects.length} subjects
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedCourse ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
              </svg>
            </div>
          </button>

          {/* Subjects Table */}
          {expandedCourse && courseSubjects.length > 0 && (
            <div className='border-t border-gray-100'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-gray-50'>
                    <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3 border-b border-gray-100'>
                      Subject Code
                    </th>
                    <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3 border-b border-gray-100'>
                      Subject Name
                    </th>
                    <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3 border-b border-gray-100'>
                      Units
                    </th>
                    <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3 border-b border-gray-100'>
                      Prerequisites
                    </th>
                    <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3 border-b border-gray-100'>
                      Status
                    </th>
                    <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3 border-b border-gray-100'>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseSubjects.map((subject, idx) => (
                    <tr
                      key={subject.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        idx < courseSubjects.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <td className='px-6 py-3.5 text-xs font-medium text-gray-700'>{subject.code}</td>
                      <td className='px-6 py-3.5 text-sm text-gray-800'>{subject.title}</td>
                      <td className='px-6 py-3.5 text-center'>
                        <span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>
                          {subject.units} units
                        </span>
                      </td>
                      <td className='px-6 py-3.5 text-center'>
                        {subject.prerequisites.length > 0 ? (
                          <span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100'>
                            {subject.prerequisites.length} required
                          </span>
                        ) : (
                          <span className='text-xs text-gray-500'>None</span>
                        )}
                      </td>
                      <td className='px-6 py-3.5 text-center'>
                        {subject.isReserved ? (
                          <span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100'>
                            ✓ Reserved
                          </span>
                        ) : subject.prerequisites.length > 0 && !subject.prerequisitesMet ? (
                          <span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100'>
                            Prerequisites Not Met
                          </span>
                        ) : (
                          <span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>
                            Available
                          </span>
                        )}
                      </td>
                      <td className='px-6 py-3.5 text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <button
                            onClick={() => openDetailsModal(subject)}
                            className='text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
                          >
                            Details
                          </button>
                          {subject.isReserved ? (
                            <button
                              onClick={() => openUnreservingModal(subject)}
                              className='text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors'
                            >
                              Unreserve
                            </button>
                          ) : (
                            <button
                              onClick={() => openReservingModal(subject)}
                              disabled={subject.prerequisites.length > 0 && !subject.prerequisitesMet}
                              className='text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              Reserve
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

          {expandedCourse && courseSubjects.length === 0 && (
            <div className='p-6 text-center'>
              <p className='text-gray-500 text-sm'>No subjects available for your course</p>
            </div>
          )}
        </div>
      ) : (
        <div className='bg-white rounded-xl border border-gray-100 p-10'>
          <div className='text-center'>
            <svg className='w-12 h-12 text-gray-300 mx-auto mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4v2m0 4v2M6.343 17.657l1.414-1.414M17.657 6.343l-1.414 1.414M9.172 9.172L7.757 7.757M16.243 16.243l-1.414 1.414' />
            </svg>
            <p className='text-gray-500 font-medium'>Course information not available</p>
            <p className='text-gray-400 text-sm mt-1'>Please contact your administrator</p>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedSubject(null)
        }}
        title='Subject Details'
        size='lg'
      >
        {selectedSubject && (
          <div className='space-y-6'>
            {/* Subject Info */}
            <div className='border-b border-slate-200 pb-4'>
              <h3 className='text-sm font-semibold text-slate-900 mb-3'>Subject Information</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Subject Code</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedSubject.code}</p>
                </div>
                <div>
                  <p className='text-xs text-slate-500 mb-1'>Units</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedSubject.units}</p>
                </div>
                <div className='col-span-2'>
                  <p className='text-xs text-slate-500 mb-1'>Subject Title</p>
                  <p className='text-sm font-medium text-slate-800'>{selectedSubject.title}</p>
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            {selectedSubject.prerequisites.length > 0 && (
              <div>
                <h3 className='text-sm font-semibold text-slate-900 mb-3'>
                  Prerequisites ({selectedSubject.prerequisites.length})
                </h3>
                <div className='space-y-2'>
                  {selectedSubject.prerequisites.map((prereq) => {
                    const isMet = grades.some((g) => g.subjectID === prereq.id && g.studentID === user?.id)
                    return (
                      <div key={prereq.id} className={`flex items-start gap-3 p-3 rounded-lg ${isMet ? 'bg-green-50' : 'bg-red-50'}`}>
                        <svg
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isMet ? 'text-green-500' : 'text-red-500'}`}
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          {isMet ? (
                            <path d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' />
                          ) : (
                            <path d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' />
                          )}
                        </svg>
                        <div className='flex-1'>
                          <p className={`text-sm font-medium ${isMet ? 'text-green-900' : 'text-red-900'}`}>
                            {prereq.code}
                          </p>
                          <p className={`text-xs ${isMet ? 'text-green-700' : 'text-red-700'}`}>
                            {prereq.title}
                          </p>
                          <p className={`text-xs mt-1 ${isMet ? 'text-green-600' : 'text-red-600'}`}>
                            {isMet ? '✓ Completed' : '✗ Not taken'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedSubject.prerequisites.length === 0 && (
              <div className='p-4 bg-blue-50 rounded-lg border border-blue-100'>
                <p className='text-sm text-blue-700'>No prerequisites required for this subject</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reserve Modal */}
      <Modal
        isOpen={isReservingOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsReservingOpen(false)
            setSelectedSubject(null)
          }
        }}
        title='Reserve Subject'
        size='sm'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (!isProcessing) {
                  setIsReservingOpen(false)
                  setSelectedSubject(null)
                }
              }}
              disabled={isProcessing}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleReserveSubject}
              disabled={isProcessing}
              className='rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50'
            >
              {isProcessing ? 'Reserving...' : 'Reserve'}
            </button>
          </div>
        }
      >
        <p className='text-sm text-slate-600'>
          Are you sure you want to reserve <span className='font-semibold text-slate-800'>{selectedSubject?.code}</span>?
          {selectedSubject?.prerequisites.length === 0
            ? ' This subject has no prerequisites.'
            : ` All prerequisites have been met.`}
        </p>
      </Modal>

      {/* Unreserve Modal */}
      <Modal
        isOpen={isUnreservingOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsUnreservingOpen(false)
            setSelectedSubject(null)
          }
        }}
        title='Unreserve Subject'
        size='sm'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (!isProcessing) {
                  setIsUnreservingOpen(false)
                  setSelectedSubject(null)
                }
              }}
              disabled={isProcessing}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleUnreserveSubject}
              disabled={isProcessing}
              className='rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50'
            >
              {isProcessing ? 'Unreserving...' : 'Unreserve'}
            </button>
          </div>
        }
      >
        <p className='text-sm text-slate-600'>
          Are you sure you want to cancel your reservation for{' '}
          <span className='font-semibold text-slate-800'>{selectedSubject?.code}</span>?
        </p>
      </Modal>
    </section>
  )
}