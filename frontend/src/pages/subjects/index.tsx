'use client'
import { useEffect, useMemo, useState } from 'react'
import { apiCall } from '@/lib/api'

type SubjectApi = {
    id: string
    courseID?: string
    course_id?: string
    code: string
    title: string
    units: number | string
    createdAt?: string
    created_at?: string
    updatedAt?: string
    updated_at?: string
}

type CourseApi = {
    id: string
    code: string
    name: string
}

type Subject = {
    id: string
    courseID: string
    code: string
    title: string
    units: number
    createdAt: string
    updatedAt: string
}

type CourseOption = {
    id: string
    code: string
    name: string
}

export default function Subjects() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [courses, setCourses] = useState<CourseOption[]>([])
    const [query, setQuery] = useState('')
    const [courseFilter, setCourseFilter] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const [subjectsResponse, coursesResponse] = await Promise.all([
                    apiCall('/subjects'),
                    apiCall('/courses')
                ])

                const mappedSubjects: Subject[] = (subjectsResponse as SubjectApi[]).map((s) => ({
                    id: s.id,
                    courseID: s.courseID ?? s.course_id ?? '',
                    code: s.code,
                    title: s.title,
                    units: Number(s.units) || 0,
                    createdAt: s.createdAt ?? s.created_at ?? '',
                    updatedAt: s.updatedAt ?? s.updated_at ?? ''
                }))

                const mappedCourses: CourseOption[] = (coursesResponse as CourseApi[]).map((c) => ({
                    id: c.id,
                    code: c.code,
                    name: c.name
                }))

                setSubjects(mappedSubjects)
                setCourses(mappedCourses)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch subjects')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const filteredSubjects = useMemo(() => {
        const q = query.trim().toLowerCase()
        return subjects.filter((subject) => {
            const matchesQuery =
                !q ||
                subject.code.toLowerCase().includes(q) ||
                subject.title.toLowerCase().includes(q)

            const matchesCourse = !courseFilter || subject.courseID === courseFilter
            return matchesQuery && matchesCourse
        })
    }, [subjects, query, courseFilter])

    const formatDate = (value: string) => {
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return 'N/A'
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const getCourseLabel = (courseID: string) => {
        const course = courses.find((c) => c.id === courseID)
        if (!course) return 'Unknown Course'
        return course.code + ' - ' + course.name
    }

    return (
        <main className='min-h-screen bg-slate-50 p-6 md:p-8'>
            <div className='mx-auto space-y-6'>
                <header className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200'>
                    <h1 className='text-2xl font-semibold text-slate-900'>Subjects</h1>
                    <p className='mt-1 text-sm text-slate-500'>
                        Browse all subjects and filter them by course.
                    </p>
                </header>
                <section className='rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6'>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                        <input
                            type='text'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='Search by code or title'
                            className='w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400'
                        />

                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className='w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400'
                        >
                            <option value=''>All Courses</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                </option>
                            ))}
                        </select>

                        <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700'>
                            Showing {filteredSubjects.length} of {subjects.length}
                        </div>
                    </div>

                    {loading ? (
                        <div className='mt-5 rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500'>
                            Loading subjects...
                        </div>
                    ) : error ? (
                        <div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700'>
                            {error}
                        </div>
                    ) : filteredSubjects.length === 0 ? (
                        <div className='mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500'>
                            No subjects found.
                        </div>
                    ) : (
                        <div className='mt-5 overflow-x-auto rounded-xl border border-slate-200'>
                            <table className='min-w-full divide-y divide-slate-200'>
                                <thead className='bg-slate-50'>
                                    <tr>
                                        <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                            Code
                                        </th>
                                        <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                            Title
                                        </th>
                                        <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                            Course
                                        </th>
                                        <th className='px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                            Units
                                        </th>
                                        <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                            Updated
                                        </th>
                                        <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 bg-white'>
                                    {filteredSubjects.map((subject) => (
                                        <tr key={subject.id} className='hover:bg-slate-50'>
                                            <td className='px-4 py-3 text-sm font-semibold text-slate-800'>{subject.code}</td>
                                            <td className='px-4 py-3 text-sm text-slate-700'>{subject.title}</td>
                                            <td className='px-4 py-3 text-sm text-slate-600'>{getCourseLabel(subject.courseID)}</td>
                                            <td className='px-4 py-3 text-center text-sm text-slate-700'>{subject.units}</td>
                                            <td className='px-4 py-3 text-sm text-slate-600'>{formatDate(subject.updatedAt)}</td>
                                            <td className='px-4 py-3 text-sm text-slate-600 flex flex-row gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => console.log('Edit', subject)}
                                                    className='bg-blue-300 p-0.5 rounded-sm cursor-pointer'
                                                >
                                                    <svg xmlns='http://www.w3.org/2000/svg' height='20px' viewBox='0 -960 960 960' width='20px' fill='#2854C5'>
                                                        <path d='M216-216h51l375-375-51-51-375 375v51Zm-72 72v-153l498-498q11-11 23.84-16 12.83-5 27-5 14.16 0 27.16 5t24 16l51 51q11 11 16 24t5 26.54q0 14.45-5.02 27.54T795-642L297-144H144Zm600-549-51-51 51 51Zm-127.95 76.95L591-642l51 51-25.95-25.05Z' />
                                                    </svg>
                                                </button>

                                                <button
                                                    type='button'
                                                    onClick={() => console.log('Delete', subject)}
                                                    className='bg-red-300 p-0.5 rounded-sm cursor-pointer'
                                                >
                                                    <svg xmlns='http://www.w3.org/2000/svg' height='20px' viewBox='0 -960 960 960' width='20px' fill='#8C1A10'>
                                                        <path d='M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z' />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}