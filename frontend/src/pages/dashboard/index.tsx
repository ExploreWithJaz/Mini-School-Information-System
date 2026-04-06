'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { apiCall } from '@/lib/api'
import { useRouteProtection } from '@/hooks/useRouteProtection'

const TABS = ['Overview', 'Grades', 'Prerequisites']

interface Student {
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
}

interface Subject {
  id: string
  code: string
  title: string
  units: number
}

interface Grade {
  id: string
  studentID: string
  subjectID: string
  prelim: number
  midterm: number
  finals: number
  finalGrade: number
  remarks: string
}

interface Reservation {
  id: string
  studentID: string
  subjectID: string
  reservedAt: string
  status: 'reserved' | 'cancelled'
}

interface SubjectPrerequisite {
  id: string
  subjectID: string
  prerequisiteSubjectID: string
}

interface EligibleSubject {
  id: string
  code: string
  title: string
  units: number
  eligible: boolean
  missingPrerequisites: Array<{ id: string; code: string; title: string }>
}

interface StudentApi {
  id: string
  student_number?: string
  studentNumber?: string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  email: string
  birth_date?: string
  birthDate?: string
  course_id?: string
  courseId?: string
}

interface CourseApi {
  id: string
  code: string
  name: string
}

interface GradeApi {
  id: string
  studentID?: string
  student_id?: string
  subjectID?: string
  subject_id?: string
  prelim: number | string
  midterm: number | string
  finals: number | string
  finalGrade?: number | string
  final_grade?: number | string
  remarks: string
}

interface ReservationApi {
  id: string
  studentID?: string
  student_id?: string
  subjectID?: string
  subject_id?: string
  reservedAt?: string
  reserved_at?: string
  status: 'reserved' | 'cancelled'
}

interface SubjectPrerequisiteApi {
  id: string
  subjectID?: string
  subject_id?: string
  prerequisiteSubjectID?: string
  prerequisite_subject_id?: string
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const { hasAccess, loading } = useRouteProtection({})
  const [activeTab, setActiveTab] = useState('Overview')
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [student, setStudent] = useState<Student | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [prerequisites, setPrerequisites] = useState<SubjectPrerequisite[]>([])
  const [eligibleSubjects, setEligibleSubjects] = useState<EligibleSubject[]>([])

  const normalizedSubjects = useMemo(() => {
    return subjects.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      units: Number(s.units)
    }))
  }, [subjects])

  const subjectMap = useMemo(() => {
    return new Map(normalizedSubjects.map((subject) => [subject.id, subject]))
  }, [normalizedSubjects])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!hasAccess || !user?.email) {
        setDashboardLoading(false)
        return
      }

      try {
        setDashboardLoading(true)
        setError(null)

        const studentsRes = await apiCall(
          `/students?search=${encodeURIComponent(user.email)}&limit=100`,
          { token: token ?? undefined }
        )

        const rawStudents = (Array.isArray(studentsRes) ? studentsRes : studentsRes.data || []) as StudentApi[]

        const studentsList = rawStudents.map((s) => ({
          id: s.id,
          studentNumber: s.student_number || s.studentNumber,
          firstName: s.first_name || s.firstName,
          lastName: s.last_name || s.lastName,
          email: s.email,
          birthDate: s.birth_date || s.birthDate,
          courseId: s.course_id || s.courseId
        })) as Student[]

        const currentStudent = studentsList.find((s) => s.email === user.email)

        if (!currentStudent) {
          setStudent(null)
          setError('Student profile not found for this account.')
          return
        }

        setStudent(currentStudent)

        const [coursesRes, gradesRes, reservationsRes, subjectsRes, prerequisitesRes, eligibleRes] = await Promise.all([
          apiCall('/courses', { token: token ?? undefined }),
          apiCall(`/students/${currentStudent.id}/grades`, { token: token ?? undefined }),
          apiCall(`/students/${currentStudent.id}/reservations`, { token: token ?? undefined }),
          apiCall(`/courses/${currentStudent.courseId}/subjects`, { token: token ?? undefined }),
          apiCall('/subject-prerequisites', { token: token ?? undefined }),
          apiCall(`/students/${currentStudent.id}/eligible-subjects`, { token: token ?? undefined })
        ])

        const coursesList = (Array.isArray(coursesRes) ? coursesRes : coursesRes.data || []) as CourseApi[]
        const matchedCourse = coursesList.find((c) => c.id === currentStudent.courseId)
        setCourse(
          matchedCourse
            ? {
                id: matchedCourse.id,
                code: matchedCourse.code,
                name: matchedCourse.name
              }
            : null
        )

        const rawGrades = (Array.isArray(gradesRes) ? gradesRes : gradesRes.data || []) as GradeApi[]
        const normalizedGrades = rawGrades.map((g) => ({
          id: g.id,
          studentID: g.studentID || g.student_id,
          subjectID: g.subjectID || g.subject_id,
          prelim: Number(g.prelim),
          midterm: Number(g.midterm),
          finals: Number(g.finals),
          finalGrade: Number(g.finalGrade || g.final_grade),
          remarks: g.remarks
        })) as Grade[]

        const rawReservations = (
          Array.isArray(reservationsRes) ? reservationsRes : reservationsRes.data || []
        ) as ReservationApi[]
        const normalizedReservations = rawReservations.map((r) => ({
          id: r.id,
          studentID: r.studentID || r.student_id,
          subjectID: r.subjectID || r.subject_id,
          reservedAt: r.reservedAt || r.reserved_at,
          status: r.status
        })) as Reservation[]

        const rawPrerequisites = (
          Array.isArray(prerequisitesRes) ? prerequisitesRes : prerequisitesRes.data || []
        ) as SubjectPrerequisiteApi[]
        const normalizedPrerequisites = rawPrerequisites.map((p) => ({
          id: p.id,
          subjectID: p.subjectID || p.subject_id,
          prerequisiteSubjectID: p.prerequisiteSubjectID || p.prerequisite_subject_id
        })) as SubjectPrerequisite[]

        setSubjects((Array.isArray(subjectsRes) ? subjectsRes : subjectsRes.data || []) as Subject[])
        setGrades(normalizedGrades)
        setReservations(normalizedReservations)
        setPrerequisites(normalizedPrerequisites)
        setEligibleSubjects((eligibleRes?.subjects || []) as EligibleSubject[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.')
      } finally {
        setDashboardLoading(false)
      }
    }

    fetchDashboardData()
  }, [hasAccess, user?.email, token])

  const reservedSubjects = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.status === 'reserved')
      .map((reservation) => ({
        ...reservation,
        subject: subjectMap.get(reservation.subjectID)
      }))
  }, [reservations, subjectMap])

  const getRequiresForSubject = (subjectId: string) => {
    return prerequisites
      .filter((item) => item.subjectID === subjectId)
      .map((item) => subjectMap.get(item.prerequisiteSubjectID))
      .filter(Boolean) as Subject[]
  }

  const formatDate = (date: string) => {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime())
      ? 'N/A'
      : parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
  }

  if (loading || dashboardLoading) return <div className='flex items-center justify-center min-h-screen'>Loading...</div>
  if (!hasAccess) return null

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>

      {error && (
        <div className='mb-5 bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-700 text-sm font-medium'>{error}</p>
        </div>
      )}

      {/* Student Basic Information */}
      <div className='flex flex-row justify-start items-center gap-40 bg-white p-10 rounded-xl border border-gray-100 mb-5'>
        <div className='flex flex-row gap-10 items-center'>
          <Image
            className='w-32 h-32 rounded-full border border-gray-100 object-cover'
            src='https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'
            alt='Student Profile'
            width={128}
            height={128}
          />
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>{student?.lastName || 'N/A'}</h2>
            <p className='text-xl text-gray-500 font-light'>{student ? `${student.firstName}` : 'N/A'}</p>
            <span className='mt-2 inline-block text-[11px] font-medium px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100'>
              Active
            </span>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <p className='text-sm'><span className='text-gray-400'>Student No.</span> <span className='ml-3 font-medium text-gray-800'>{student?.studentNumber || 'N/A'}</span></p>
          <p className='text-sm'><span className='text-gray-400'>Email</span> <span className='ml-3 font-medium text-gray-800'>{student?.email || 'N/A'}</span></p>
          <p className='text-sm'><span className='text-gray-400'>Date of Birth</span> <span className='ml-3 font-medium text-gray-800'>{student?.birthDate ? formatDate(student.birthDate) : 'N/A'}</span></p>
          <p className='text-sm'><span className='text-gray-400'>Course</span> <span className='ml-3 font-medium text-gray-800'>{course ? `${course.name} (${course.code})` : 'N/A'}</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 w-fit'>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-indigo-500 text-white'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className='flex flex-col gap-5'>

          {/* Class Schedule */}
          <div className='bg-white p-5 rounded-xl border border-gray-100'>
            <h2 className='text-base font-medium text-gray-900 mb-4'>Class Schedule</h2>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Course Code</th>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Subject Name</th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Units</th>
                </tr>
              </thead>
              <tbody>
                {reservedSubjects.length > 0 ? (
                  reservedSubjects.map((reservation, index) => (
                    <tr
                      key={reservation.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index !== reservedSubjects.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>{reservation.subject?.code || 'N/A'}</td>
                      <td className='px-4 py-3.5 text-sm text-gray-800'>{reservation.subject?.title || 'Unknown Subject'}</td>
                      <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>{reservation.subject?.units ?? 0} units</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className='px-4 py-8 text-center text-sm text-gray-400'>No approved reserved subjects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Reserved Subjects */}
          <div className='bg-white p-5 rounded-xl border border-gray-100'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-medium text-gray-900'>Reserved Subjects</h2>
              <span className='text-[11px] font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100'>Live Data</span>
            </div>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Course Code</th>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Subject Name</th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Units</th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length > 0 ? (
                  reservations.map((reservation, index) => {
                    const reservationSubject = subjectMap.get(reservation.subjectID)
                    return (
                      <tr
                        key={reservation.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index !== reservations.length - 1 ? 'border-b border-gray-50' : ''
                        }`}
                      >
                        <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>{reservationSubject?.code || 'N/A'}</td>
                        <td className='px-4 py-3.5 text-sm text-gray-800'>{reservationSubject?.title || 'Unknown Subject'}</td>
                        <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>{reservationSubject?.units ?? 0} units</span></td>
                        <td className='px-4 py-3.5 text-center'>
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              reservation.status === 'reserved'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {reservation.status === 'reserved' ? 'Reserved' : 'Cancelled'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className='px-4 py-8 text-center text-sm text-gray-400'>No reservation records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className='text-xs text-gray-400 mt-3'>Reserved subjects are subject to approval by the registrar.</p>
          </div>

        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'Grades' && (
        <div className='bg-white p-5 rounded-xl border border-gray-100'>
          <h2 className='text-base font-medium text-gray-900 mb-4'>Grades</h2>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='bg-gray-50'>
                <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Course Code</th>
                <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Subject Name</th>
                <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Midterm</th>
                <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Final</th>
                <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Grade</th>
                <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {grades.length > 0 ? (
                grades.map((grade, index) => {
                  const gradeSubject = subjectMap.get(grade.subjectID)
                  const isPassed = grade.remarks?.toLowerCase().includes('pass') || grade.finalGrade >= 75

                  return (
                    <tr
                      key={grade.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index !== grades.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>{gradeSubject?.code || 'N/A'}</td>
                      <td className='px-4 py-3.5 text-sm text-gray-800'>{gradeSubject?.title || 'Unknown Subject'}</td>
                      <td className='px-4 py-3.5 text-center text-sm text-gray-700'>{grade.midterm}</td>
                      <td className='px-4 py-3.5 text-center text-sm text-gray-700'>{grade.finals}</td>
                      <td className='px-4 py-3.5 text-center text-sm font-medium text-gray-900'>{grade.finalGrade}</td>
                      <td className='px-4 py-3.5 text-center'>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            isPassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                          }`}
                        >
                          {isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className='px-4 py-8 text-center text-sm text-gray-400'>No grades found for this student.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Prerequisites Tab */}
      {activeTab === 'Prerequisites' && (
        <div className='bg-white p-5 rounded-xl border border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-medium text-gray-900'>Prerequisite Status</h2>
            <p className='text-xs text-gray-400'>Based on your completed subjects</p>
          </div>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='bg-gray-50'>
                <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Course Code</th>
                <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Subject Name</th>
                <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Requires</th>
                <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Missing</th>
                <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-100'>Eligibility</th>
              </tr>
            </thead>
            <tbody>
              {eligibleSubjects.length > 0 ? (
                eligibleSubjects.map((subject, index) => {
                  const requires = getRequiresForSubject(subject.id)
                  return (
                    <tr
                      key={subject.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index !== eligibleSubjects.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>{subject.code}</td>
                      <td className='px-4 py-3.5 text-sm text-gray-800'>{subject.title}</td>
                      <td className='px-4 py-3.5'>
                        {requires.length > 0 ? (
                          <div className='flex gap-1 flex-wrap'>
                            {requires.map((requiredSubject) => (
                              <span key={`${subject.id}-${requiredSubject.id}`} className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>
                                {requiredSubject.code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className='text-sm text-gray-400'>None</span>
                        )}
                      </td>
                      <td className='px-4 py-3.5'>
                        {subject.missingPrerequisites.length > 0 ? (
                          <div className='flex gap-1 flex-wrap'>
                            {subject.missingPrerequisites.map((missing) => (
                              <span key={`${subject.id}-missing-${missing.id}`} className='text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400'>
                                {missing.code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className='text-sm text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-4 py-3.5 text-center'>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            subject.eligible
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-500'
                          }`}
                        >
                          {subject.eligible ? 'Eligible' : 'Not Eligible'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className='px-4 py-8 text-center text-sm text-gray-400'>No prerequisite data found.</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className='text-xs text-gray-400 mt-3'>Missing prerequisites shown in red must be completed before enrolling.</p>
        </div>
      )}

    </section>
  )
}