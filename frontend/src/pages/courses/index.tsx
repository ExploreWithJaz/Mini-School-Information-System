'use client'
import { useEffect, useMemo, useState } from 'react'
import { apiCall } from '@/lib/api'

type CourseApi = {
  id: string
  code: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

type Course = {
  id: string
  code: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiCall('/courses')
        const rows = response as CourseApi[]

        const mapped: Course[] = rows.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description ?? 'No description provided',
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }))

        setCourses(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses

    return courses.filter((course) => {
      return (
        course.code.toLowerCase().includes(q) ||
        course.name.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q)
      )
    })
  }, [courses, query])

  const formatDate = (value: string) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleDeleteCourse = async (courseId: string) => {
    const confirmed = window.confirm('Delete this course? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeletingId(courseId)
      setError(null)
      await apiCall(`/courses/${courseId}`, { method: 'DELETE' })
      setCourses((prev) => prev.filter((course) => course.id !== courseId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditCourse = async (course: Course) => {
    const nextCode = window.prompt('Course code', course.code)
    if (nextCode === null) return

    const nextName = window.prompt('Course name', course.name)
    if (nextName === null) return

    const nextDescription = window.prompt('Course description', course.description)
    if (nextDescription === null) return

    try {
      setError(null)
      const updated = (await apiCall(`/courses/${course.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          code: nextCode.trim(),
          name: nextName.trim(),
          description: nextDescription.trim()
        })
      })) as CourseApi

      setCourses((prev) =>
        prev.map((item) =>
          item.id === course.id
            ? {
                id: updated.id,
                code: updated.code,
                name: updated.name,
                description: updated.description ?? 'No description provided',
                createdAt: updated.created_at,
                updatedAt: updated.updated_at
              }
            : item
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course')
    }
  }

  return (
    <main className='min-h-screen bg-slate-50 p-6 md:p-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <header className='flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>Courses</h1>
            <p className='mt-1 text-sm text-slate-500'>
              Browse and manage available programs in the database.
            </p>
          </div>
        </header>

        <section className='rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6'>
          <div className='relative w-full md:max-w-md'>
            <input
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search by code, name, or description'
              className='w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400'
            />
          </div>

          {loading ? (
            <div className='mt-5 rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500'>
              Loading courses...
            </div>
          ) : error ? (
            <div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700'>
              {error}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className='mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500'>
              No courses found.
            </div>
          ) : (
            <div className='mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {filteredCourses.map((course) => (
                <article
                  key={course.id}
                  className='rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-xs font-semibold tracking-wide text-slate-500'>{course.code}</p>
                      <h2 className='mt-1 text-base font-semibold text-slate-900'>{course.name}</h2>
                    </div>
                    <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'>
                      Active
                    </span>
                  </div>

                  <p className='mt-4 text-sm text-slate-600'>{course.description}</p>

                  <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <dt className='text-slate-500'>Created</dt>
                      <dd className='font-medium text-slate-800'>{formatDate(course.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className='text-slate-500'>Updated</dt>
                      <dd className='font-medium text-slate-800'>{formatDate(course.updatedAt)}</dd>
                    </div>
                  </dl>

                  <div className='mt-4 flex items-center justify-end gap-2'>
                    <button
                      type='button'
                      onClick={() => handleEditCourse(course)}
                      className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50'
                    >
                      Edit
                    </button>
                    <button
                      type='button'
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={deletingId === course.id}
                      className='rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      {deletingId === course.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
