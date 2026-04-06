'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { apiCall } from '@/lib/api'
import { useRouteProtection } from '@/hooks/useRouteProtection'

type StudentApi = {
  id: string
  student_number: string
  first_name: string
  last_name: string
  email: string
  course_id: string
}

type CourseApi = {
  id: string
  code: string
  name: string
}

type SubjectApi = {
  id: string
  code: string
  title: string
}

type ReservationApi = {
  id: string
  studentID: string
  subjectID: string
  reservedAt?: string
  status: 'reserved' | 'cancelled'
}

type GradeApi = {
  id: string
  studentID: string
  subjectID: string
  finalGrade?: number | string
  remarks?: string
  updatedAt?: string
}

type AdminSummary = {
  students: number
  courses: number
  subjects: number
  reservations: number
  grades: number
  users: number
  pendingReservations: number
  passedGrades: number
  failedGrades: number
}

type ReservationRow = {
  id: string
  studentName: string
  studentNumber: string
  subjectCode: string
  subjectTitle: string
  status: 'reserved' | 'cancelled'
  reservedAt: string
}

type GradeRow = {
  id: string
  studentName: string
  studentNumber: string
  subjectCode: string
  subjectTitle: string
  finalGrade: number
  remarks: string
  status: 'passed' | 'failed' | 'unknown'
  updatedAt: string
}

const initialSummary: AdminSummary = {
  students: 0,
  courses: 0,
  subjects: 0,
  reservations: 0,
  grades: 0,
  users: 0,
  pendingReservations: 0,
  passedGrades: 0,
  failedGrades: 0
}

const metricToneClasses = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100'
} as const

const normalizeArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]

  if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data
  }

  return []
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'A'
}

const getGradeStatus = (grade: GradeApi): 'passed' | 'failed' | 'unknown' => {
  const remarks = String(grade.remarks ?? '').trim().toUpperCase()
  if (remarks === 'PASSED') return 'passed'
  if (remarks === 'FAILED') return 'failed'

  const rawFinalGrade = grade.finalGrade
  const finalGrade = typeof rawFinalGrade === 'number' ? rawFinalGrade : Number(rawFinalGrade)

  if (!Number.isFinite(finalGrade)) return 'unknown'

  return finalGrade >= 75 ? 'passed' : 'failed'
}

const metricCards = [
  { label: 'Students', tone: 'indigo' as const, detail: 'Registered learners' },
  { label: 'Courses', tone: 'emerald' as const, detail: 'Active catalog entries' },
  { label: 'Subjects', tone: 'slate' as const, detail: 'Available subject records' },
  { label: 'Reservations', tone: 'amber' as const, detail: 'Queue for approval' },
  { label: 'Grade records', tone: 'rose' as const, detail: 'Encoded assessments' },
  { label: 'Users', tone: 'indigo' as const, detail: 'System accounts' }
]

export default function AdminDashboard() {
  const { hasAccess, loading } = useRouteProtection({
    requiredRoles: ['Admin'],
    redirectToHome: true
  })
  const { token, user } = useAuth()
  const [summary, setSummary] = useState<AdminSummary>(initialSummary)
  const [pendingReservations, setPendingReservations] = useState<ReservationRow[]>([])
  const [recentGrades, setRecentGrades] = useState<GradeRow[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAccess) {
      setLoadingDashboard(false)
      return
    }

    const loadDashboard = async () => {
      try {
        setLoadingDashboard(true)
        setError(null)

        const [studentsFirstPage, coursesResponse, subjectsResponse, gradesResponse, usersResponse, reservationsResponse] = await Promise.all([
          apiCall('/students?page=1&limit=100', { token: token ?? undefined }),
          apiCall('/courses', { token: token ?? undefined }),
          apiCall('/subjects', { token: token ?? undefined }),
          apiCall('/grades', { token: token ?? undefined }),
          apiCall('/users', { token: token ?? undefined }),
          apiCall('/subject-reservations', { token: token ?? undefined })
        ])

        const studentsPayload = studentsFirstPage as { data?: StudentApi[]; pagination?: { total?: number; totalPages?: number } }
        const students = normalizeArray<StudentApi>(studentsPayload.data)
        const totalPages = studentsPayload.pagination?.totalPages ?? 1

        if (totalPages > 1) {
          const remainingPageResponses = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map((page) =>
              apiCall(`/students?page=${page}&limit=100`, { token: token ?? undefined })
            )
          )

          remainingPageResponses.forEach((response) => {
            const pageData = response as { data?: StudentApi[] }
            students.push(...normalizeArray<StudentApi>(pageData.data))
          })
        }

        const courses = normalizeArray<CourseApi>(coursesResponse)
        const subjects = normalizeArray<SubjectApi>(subjectsResponse)
        const grades = normalizeArray<GradeApi>(gradesResponse)
        const users = normalizeArray<{ id: string }>(usersResponse)
        const reservations = normalizeArray<ReservationApi>(reservationsResponse)

        const studentMap = new Map(students.map((student) => [student.id, student]))
        const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]))

        const reservationRows: ReservationRow[] = reservations
          .filter((reservation) => reservation.status === 'reserved')
          .slice(0, 5)
          .map((reservation) => {
            const student = studentMap.get(reservation.studentID)
            const subject = subjectMap.get(reservation.subjectID)

            return {
              id: reservation.id,
              studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown student',
              studentNumber: student?.student_number ?? 'N/A',
              subjectCode: subject?.code ?? reservation.subjectID,
              subjectTitle: subject?.title ?? 'Unknown subject',
              status: reservation.status,
              reservedAt: reservation.reservedAt ?? ''
            }
          })

        const gradeRows: GradeRow[] = grades.slice(0, 5).map((grade) => {
          const student = studentMap.get(grade.studentID)
          const subject = subjectMap.get(grade.subjectID)
          const status = getGradeStatus(grade)

          return {
            id: grade.id,
            studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown student',
            studentNumber: student?.student_number ?? 'N/A',
            subjectCode: subject?.code ?? grade.subjectID,
            subjectTitle: subject?.title ?? 'Unknown subject',
            finalGrade: Number(grade.finalGrade ?? 0),
            remarks: grade.remarks ?? 'N/A',
            status,
            updatedAt: grade.updatedAt ?? ''
          }
        })

        const passedGrades = grades.filter((grade) => getGradeStatus(grade) === 'passed').length
        const failedGrades = grades.filter((grade) => getGradeStatus(grade) === 'failed').length

        setSummary({
          students: studentsPayload.pagination?.total ?? students.length,
          courses: courses.length,
          subjects: subjects.length,
          reservations: reservations.length,
          grades: grades.length,
          users: users.length,
          pendingReservations: reservations.filter((reservation) => reservation.status === 'reserved').length,
          passedGrades,
          failedGrades
        })
        setPendingReservations(reservationRows)
        setRecentGrades(gradeRows)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin dashboard data')
        setSummary(initialSummary)
        setPendingReservations([])
        setRecentGrades([])
      } finally {
        setLoadingDashboard(false)
      }
    }

    loadDashboard()
  }, [hasAccess, token])

  const passRate = summary.grades > 0 ? Math.round((summary.passedGrades / summary.grades) * 100) : 0
  const workload = summary.courses > 0 ? Math.round(summary.students / summary.courses) : 0

  const managementNotes = useMemo(
    () => [
      {
        title: 'Reservations awaiting review',
        value: summary.pendingReservations,
        detail: 'Students are waiting on registrar approval.'
      },
      {
        title: 'Failed grade records',
        value: summary.failedGrades,
        detail: 'Use the grades module to correct or audit records.'
      },
      {
        title: 'Average students per course',
        value: workload,
        detail: 'A quick signal of enrollment balance across programs.'
      }
    ],
    [summary.failedGrades, summary.pendingReservations, workload]
  )

  if (loading) return <div className='flex min-h-screen items-center justify-center'>Loading...</div>
  if (!hasAccess) return null

  return (
    <section className='min-h-screen bg-[linear-gradient(180deg,#f5f6fb_0%,#eef2ff_100%)] p-6 lg:p-8'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-6'>
        <header className='rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500'>Admin command center</p>
              <h1 className='mt-2 text-3xl font-semibold text-slate-900'>School operations overview</h1>
              <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-500'>
                Monitor students, courses, subjects, reservations, and grade records from one place.
                This page is built for administrative work, not student self-service.
              </p>
            </div>
            <div className='rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700'>
              <p className='text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-500'>Signed in as</p>
              <p className='mt-1 font-semibold'>{user?.email || 'Admin'}</p>
            </div>
          </div>

          <div className='mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-2xl border border-indigo-100 bg-indigo-50 p-4'>
              <p className='text-xs font-medium uppercase tracking-[0.25em] text-indigo-500'>Pass rate</p>
              <div className='mt-2 flex items-end justify-between gap-4'>
                <div>
                  <p className='text-3xl font-semibold text-indigo-700'>{passRate}%</p>
                  <p className='text-sm text-indigo-600/80'>Based on recorded grade entries</p>
                </div>
                <span className='rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600'>Live summary</span>
              </div>
            </div>

            <div className='rounded-2xl border border-emerald-100 bg-emerald-50 p-4'>
              <p className='text-xs font-medium uppercase tracking-[0.25em] text-emerald-500'>Active queue</p>
              <div className='mt-2 flex items-end justify-between gap-4'>
                <div>
                  <p className='text-3xl font-semibold text-emerald-700'>{summary.pendingReservations}</p>
                  <p className='text-sm text-emerald-600/80'>Reservations awaiting review</p>
                </div>
                <span className='rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600'>Operational</span>
              </div>
            </div>

            <div className='rounded-2xl border border-amber-100 bg-amber-50 p-4'>
              <p className='text-xs font-medium uppercase tracking-[0.25em] text-amber-500'>Course load</p>
              <div className='mt-2 flex items-end justify-between gap-4'>
                <div>
                  <p className='text-3xl font-semibold text-amber-700'>{workload}</p>
                  <p className='text-sm text-amber-600/80'>Average students per course</p>
                </div>
                <span className='rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-600'>Balanced</span>
              </div>
            </div>

            <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
              <p className='text-xs font-medium uppercase tracking-[0.25em] text-slate-500'>Catalog health</p>
              <div className='mt-2 flex items-end justify-between gap-4'>
                <div>
                  <p className='text-3xl font-semibold text-slate-800'>{summary.subjects}</p>
                  <p className='text-sm text-slate-500'>Subjects available for enrollment</p>
                </div>
                <span className='rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600'>Ready</span>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            {error}
          </div>
        )}

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-6'>
          {metricCards.map((metric) => {
            const value =
              metric.label === 'Students'
                ? summary.students
                : metric.label === 'Courses'
                  ? summary.courses
                  : metric.label === 'Subjects'
                    ? summary.subjects
                    : metric.label === 'Reservations'
                      ? summary.reservations
                      : metric.label === 'Grade records'
                        ? summary.grades
                        : summary.users

            return (
              <article key={metric.label} className={`rounded-2xl border p-4 shadow-sm ${metricToneClasses[metric.tone]}`}>
                <p className='text-xs font-medium uppercase tracking-[0.22em]'>{metric.label}</p>
                <p className='mt-3 text-3xl font-semibold'>{value}</p>
                <p className='mt-1 text-sm opacity-80'>{metric.detail}</p>
              </article>
            )
          })}
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.5fr_1fr]'>
          <section className='rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-lg font-semibold text-slate-900'>Reservation review queue</h2>
                <p className='mt-1 text-sm text-slate-500'>The newest reserved subjects that need admin attention.</p>
              </div>
              <span className='rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600'>
                {summary.pendingReservations} pending
              </span>
            </div>

            <div className='mt-5 overflow-hidden rounded-2xl border border-slate-100'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-slate-50'>
                    <th className='px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Student</th>
                    <th className='px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Subject</th>
                    <th className='px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Status</th>
                    <th className='px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Reserved</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDashboard ? (
                    <tr>
                      <td className='px-4 py-6 text-sm text-slate-500' colSpan={4}>
                        Loading reservation data...
                      </td>
                    </tr>
                  ) : pendingReservations.length > 0 ? (
                    pendingReservations.map((reservation) => (
                      <tr key={reservation.id} className='border-t border-slate-100 transition-colors hover:bg-slate-50'>
                        <td className='px-4 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700'>
                              {getInitials(reservation.studentName.split(' ')[0] || '', reservation.studentName.split(' ').slice(1).join(' ') || '')}
                            </div>
                            <div>
                              <p className='text-sm font-medium text-slate-900'>{reservation.studentName}</p>
                              <p className='text-xs text-slate-500'>{reservation.studentNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-4'>
                          <p className='text-sm font-medium text-slate-900'>{reservation.subjectCode}</p>
                          <p className='text-xs text-slate-500'>{reservation.subjectTitle}</p>
                        </td>
                        <td className='px-4 py-4 text-center'>
                          <span className='inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'>
                            {reservation.status}
                          </span>
                        </td>
                        <td className='px-4 py-4 text-right text-sm text-slate-500'>
                          {reservation.reservedAt ? formatDateTime(reservation.reservedAt) : 'Recently queued'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className='px-4 py-6 text-sm text-slate-500' colSpan={4}>
                        No active reservations waiting for review.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className='flex flex-col gap-6'>
            <section className='rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]'>
              <h2 className='text-lg font-semibold text-slate-900'>Academic health</h2>
              <p className='mt-1 text-sm text-slate-500'>Quick signals that help the registrar spot bottlenecks.</p>

              <div className='mt-5 space-y-4'>
                <div>
                  <div className='mb-2 flex items-center justify-between text-sm'>
                    <span className='text-slate-500'>Passing grade rate</span>
                    <span className='font-semibold text-slate-900'>{passRate}%</span>
                  </div>
                  <div className='h-2 rounded-full bg-slate-100'>
                    <div className='h-2 rounded-full bg-emerald-500' style={{ width: `${passRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className='mb-2 flex items-center justify-between text-sm'>
                    <span className='text-slate-500'>Failed grade records</span>
                    <span className='font-semibold text-slate-900'>{summary.failedGrades}</span>
                  </div>
                  <div className='h-2 rounded-full bg-slate-100'>
                    <div
                      className='h-2 rounded-full bg-rose-500'
                      style={{ width: `${summary.grades > 0 ? Math.min(100, Math.round((summary.failedGrades / summary.grades) * 100)) : 0}%` }}
                    />
                  </div>
                </div>

                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-[0.25em] text-slate-400'>Summary</p>
                  <p className='mt-2 text-sm leading-6 text-slate-600'>
                    {summary.students} students, {summary.courses} courses, {summary.subjects} subjects, and {summary.users} system users are currently tracked in the system.
                  </p>
                </div>
              </div>
            </section>

            <section className='rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]'>
              <h2 className='text-lg font-semibold text-slate-900'>Management priorities</h2>
              <div className='mt-4 space-y-3'>
                {managementNotes.map((note) => (
                  <div key={note.title} className='rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{note.title}</p>
                        <p className='mt-1 text-xs leading-5 text-slate-500'>{note.detail}</p>
                      </div>
                      <span className='rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-900'>{note.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className='rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-slate-900'>Recent grade activity</h2>
              <p className='mt-1 text-sm text-slate-500'>The latest grade records created or updated in the system.</p>
            </div>
            <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600'>
              {summary.grades} total records
            </span>
          </div>

          <div className='mt-5 overflow-hidden rounded-2xl border border-slate-100'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-slate-50'>
                  <th className='px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Student</th>
                  <th className='px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Subject</th>
                  <th className='px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Final grade</th>
                  <th className='px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Remarks</th>
                  <th className='px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400'>Updated</th>
                </tr>
              </thead>
              <tbody>
                {loadingDashboard ? (
                  <tr>
                    <td className='px-4 py-6 text-sm text-slate-500' colSpan={5}>
                      Loading grade data...
                    </td>
                  </tr>
                ) : recentGrades.length > 0 ? (
                  recentGrades.map((grade) => (
                    <tr key={grade.id} className='border-t border-slate-100 transition-colors hover:bg-slate-50'>
                      <td className='px-4 py-4'>
                        <p className='text-sm font-medium text-slate-900'>{grade.studentName}</p>
                        <p className='text-xs text-slate-500'>{grade.studentNumber}</p>
                      </td>
                      <td className='px-4 py-4'>
                        <p className='text-sm font-medium text-slate-900'>{grade.subjectCode}</p>
                        <p className='text-xs text-slate-500'>{grade.subjectTitle}</p>
                      </td>
                      <td className='px-4 py-4 text-center text-sm font-semibold text-slate-900'>{grade.finalGrade.toFixed(1)}</td>
                      <td className='px-4 py-4 text-center'>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${grade.status === 'passed' ? 'bg-emerald-50 text-emerald-700' : grade.status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          {grade.remarks}
                        </span>
                      </td>
                      <td className='px-4 py-4 text-right text-sm text-slate-500'>
                        {grade.updatedAt ? formatDateTime(grade.updatedAt) : 'Recently updated'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className='px-4 py-6 text-sm text-slate-500' colSpan={5}>
                      No grade activity available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className='mt-3 text-xs text-slate-400'>
            Use the sidebar to move into Students, Courses, Subjects, Reservations, or Grades for direct management.
          </p>
        </section>
      </div>
    </section>
  )
}