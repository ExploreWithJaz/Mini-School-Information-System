'use client'
import { useEffect, useMemo, useState } from 'react'
import { apiCall } from '@/lib/api'
import Modal from '@/components/modal'

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

type SubjectForm = {
    code: string
    title: string
    units: number
    courseID: string
}

type Prerequisite = {
    id: string
    subjectID: string
    prerequisiteSubjectID: string
    createdAt: string
}

type PrerequisiteApi = {
    id: string
    subjectID?: string
    subject_id?: string
    prerequisiteSubjectID?: string
    prerequisite_subject_id?: string
    createdAt?: string
    created_at?: string
}

export default function Subjects() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [courses, setCourses] = useState<CourseOption[]>([])
    const [query, setQuery] = useState('')
    const [courseFilter, setCourseFilter] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [addForm, setAddForm] = useState<SubjectForm>({ code: '', title: '', units: 0, courseID: '' })
    const [editForm, setEditForm] = useState<SubjectForm>({ code: '', title: '', units: 0, courseID: '' })
    const [isAdding, setIsAdding] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isPrerequisiteOpen, setIsPrerequisiteOpen] = useState(false)
    const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([])
    const [selectedPrerequisiteId, setSelectedPrerequisiteId] = useState('')
    const [isAddingPrerequisite, setIsAddingPrerequisite] = useState(false)
    const [prerequisiteError, setPrerequisiteError] = useState<string | null>(null)
    const [allPrerequisites, setAllPrerequisites] = useState<Prerequisite[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const [subjectsResponse, coursesResponse, prerequisitesResponse] = await Promise.all([
                    apiCall('/subjects'),
                    apiCall('/courses'),
                    apiCall('/subject-prerequisites')
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

                const mappedPrerequisites: Prerequisite[] = (prerequisitesResponse as PrerequisiteApi[]).map((p) => ({
                    id: p.id,
                    subjectID: p.subjectID ?? p.subject_id ?? '',
                    prerequisiteSubjectID: p.prerequisiteSubjectID ?? p.prerequisite_subject_id ?? '',
                    createdAt: p.createdAt ?? p.created_at ?? ''
                }))

                setSubjects(mappedSubjects)
                setCourses(mappedCourses)
                setAllPrerequisites(mappedPrerequisites)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch subjects')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const openAddModal = () => {
        setAddForm({ code: '', title: '', units: 0, courseID: '' })
        setIsAddOpen(true)
    }

    const handleAddSubject = async () => {
        const code = addForm.code.trim()
        const title = addForm.title.trim()
        const courseID = addForm.courseID.trim()

        if (!code || !title || !courseID) {
            setError('Subject code, title, and course are required')
            return
        }

        try {
            setIsAdding(true)
            setError(null)
            const created = (await apiCall('/subjects', {
                method: 'POST',
                body: JSON.stringify({
                    code,
                    title,
                    units: addForm.units,
                    courseID
                })
            })) as SubjectApi

            const createdSubject: Subject = {
                id: created.id,
                courseID: created.courseID ?? created.course_id ?? '',
                code: created.code,
                title: created.title,
                units: Number(created.units) || 0,
                createdAt: created.createdAt ?? created.created_at ?? '',
                updatedAt: created.updatedAt ?? created.updated_at ?? ''
            }

            setSubjects((prev) => [createdSubject, ...prev])
            setIsAddOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add subject')
        } finally {
            setIsAdding(false)
        }
    }

    const openEditModal = (subject: Subject) => {
        setSelectedSubject(subject)
        setEditForm({
            code: subject.code,
            title: subject.title,
            units: subject.units,
            courseID: subject.courseID
        })
        setIsEditOpen(true)
    }

    const handleEditSubject = async () => {
        if (!selectedSubject) return

        const code = editForm.code.trim()
        const title = editForm.title.trim()
        const courseID = editForm.courseID.trim()

        if (!code || !title || !courseID) {
            setError('Subject code, title, and course are required')
            return
        }

        try {
            setIsSaving(true)
            setError(null)
            const updated = (await apiCall(`/subjects/${selectedSubject.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    code,
                    title,
                    units: editForm.units,
                    courseID
                })
            })) as SubjectApi

            setSubjects((prev) =>
                prev.map((item) =>
                    item.id === selectedSubject.id
                        ? {
                            id: updated.id,
                            courseID: updated.courseID ?? updated.course_id ?? '',
                            code: updated.code,
                            title: updated.title,
                            units: Number(updated.units) || 0,
                            createdAt: updated.createdAt ?? updated.created_at ?? '',
                            updatedAt: updated.updatedAt ?? updated.updated_at ?? ''
                        }
                        : item
                )
            )

            setIsEditOpen(false)
            setSelectedSubject(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update subject')
        } finally {
            setIsSaving(false)
        }
    }

    const openDeleteModal = (subject: Subject) => {
        setSelectedSubject(subject)
        setIsDeleteOpen(true)
    }

    const handleDeleteSubject = async () => {
        if (!selectedSubject) return

        try {
            setDeletingId(selectedSubject.id)
            setError(null)
            await apiCall(`/subjects/${selectedSubject.id}`, { method: 'DELETE' })
            setSubjects((prev) => prev.filter((subject) => subject.id !== selectedSubject.id))
            setIsDeleteOpen(false)
            setSelectedSubject(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete subject')
        } finally {
            setDeletingId(null)
        }
    }

    const openPrerequisiteModal = async (subject: Subject) => {
        setSelectedSubject(subject)
        setIsPrerequisiteOpen(true)
        setSelectedPrerequisiteId('')
        setPrerequisiteError(null)
        
        try {
            const response = await apiCall(`/subjects/${subject.id}/prerequisites`)
            const mapped: Prerequisite[] = (response as PrerequisiteApi[]).map((p) => ({
                id: p.id,
                subjectID: p.subjectID ?? p.subject_id ?? '',
                prerequisiteSubjectID: p.prerequisiteSubjectID ?? p.prerequisite_subject_id ?? '',
                createdAt: p.createdAt ?? p.created_at ?? ''
            }))
            setPrerequisites(mapped)
        } catch (err) {
            setPrerequisiteError(err instanceof Error ? err.message : 'Failed to fetch prerequisites')
        }
    }

    const handleAddPrerequisite = async () => {
        if (!selectedSubject || !selectedPrerequisiteId) {
            setPrerequisiteError('Please select a prerequisite subject')
            return
        }

        if (selectedPrerequisiteId === selectedSubject.id) {
            setPrerequisiteError('A subject cannot be a prerequisite of itself')
            return
        }

        try {
            setIsAddingPrerequisite(true)
            setPrerequisiteError(null)
            await apiCall(`/subjects/${selectedSubject.id}/prerequisites`, {
                method: 'POST',
                body: JSON.stringify({ prerequisiteSubjectID: selectedPrerequisiteId })
            })

            // Refresh prerequisites
            const response = await apiCall(`/subjects/${selectedSubject.id}/prerequisites`)
            const mapped: Prerequisite[] = (response as PrerequisiteApi[]).map((p) => ({
                id: p.id,
                subjectID: p.subjectID ?? p.subject_id ?? '',
                prerequisiteSubjectID: p.prerequisiteSubjectID ?? p.prerequisite_subject_id ?? '',
                createdAt: p.createdAt ?? p.created_at ?? ''
            }))
            setPrerequisites(mapped)
            setSelectedPrerequisiteId('')
        } catch (err) {
            setPrerequisiteError(err instanceof Error ? err.message : 'Failed to add prerequisite')
        } finally {
            setIsAddingPrerequisite(false)
        }
    }

    const handleDeletePrerequisite = async (prerequisiteId: string) => {
        if (!selectedSubject) return

        try {
            setPrerequisiteError(null)
            const prereq = prerequisites.find(p => p.id === prerequisiteId)
            if (!prereq) return

            await apiCall(`/subjects/${selectedSubject.id}/prerequisites/${prereq.prerequisiteSubjectID}`, {
                method: 'DELETE'
            })

            setPrerequisites((prev) =>
                prev.filter((p) => p.id !== prerequisiteId)
            )
        } catch (err) {
            setPrerequisiteError(err instanceof Error ? err.message : 'Failed to delete prerequisite')
        }
    }

    const getSubjectLabel = (subjectId: string) => {
        const subject = subjects.find((s) => s.id === subjectId)
        if (!subject) return 'Unknown Subject'
        return `${subject.code} - ${subject.title}`
    }

    const getAvailablePrerequisites = () => {
        if (!selectedSubject) return []
        
        const alreadyAdded = new Set(prerequisites.map(p => p.prerequisiteSubjectID))
        
        return subjects.filter((s) => 
            s.courseID === selectedSubject.courseID && 
            s.id !== selectedSubject.id &&
            !alreadyAdded.has(s.id)
        )
    }

    const getPrerequisiteSubjects = (subjectId: string) => {
    return allPrerequisites
        .filter(p => p.subjectID === subjectId)
        .map(p => {
            const subject = subjects.find(s => s.id === p.prerequisiteSubjectID)
            return subject
        })
        .filter(Boolean)
    }

    const getDependentSubjects = (subjectId: string) => {
        return allPrerequisites
            .filter(p => p.prerequisiteSubjectID === subjectId)
            .map(p => {
                const subject = subjects.find(s => s.id === p.subjectID)
                return subject
            })
            .filter(Boolean)
    }

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

    const getPrerequisiteCount = (subjectId: string) => {
        return allPrerequisites.filter(p => p.subjectID === subjectId).length
    }

    const getDependentCount = (subjectId: string) => {
        return allPrerequisites.filter(p => p.prerequisiteSubjectID === subjectId).length
    }

    return (
        <main className='min-h-screen bg-slate-50 p-6 md:p-8'>
            <div className='mx-auto space-y-6'>
                <header className='flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-2xl font-semibold text-slate-900'>Subjects</h1>
                        <p className='mt-1 text-sm text-slate-500'>
                            Browse all subjects and filter them by course.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={openAddModal}
                        className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800'
                    >
                        + Add Subject
                    </button>
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
                                        <th className='px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                            Prerequisites
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
                                            <td className='px-4 py-3 text-center'>
                                                <div className='flex flex-col items-center justify-center gap-2'>
                                                    {getPrerequisiteSubjects(subject.id).length > 0 && (
                                                        <div className='flex flex-wrap gap-1 justify-center'>
                                                            {getPrerequisiteSubjects(subject.id).map((prereqSubject) => (
                                                                <span
                                                                    key={prereqSubject?.id}
                                                                    className='inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800'
                                                                    title={`Requires: ${prereqSubject?.title}`}
                                                                >
                                                                    {prereqSubject?.code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {getDependentSubjects(subject.id).length > 0 && (
                                                        <div className='flex flex-wrap gap-1 justify-center'>
                                                            {getDependentSubjects(subject.id).map((depSubject) => (
                                                                <span
                                                                    key={depSubject?.id}
                                                                    className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800'
                                                                    title={`Required by: ${depSubject?.title}`}
                                                                >
                                                                    {depSubject?.code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {getPrerequisiteSubjects(subject.id).length === 0 && getDependentSubjects(subject.id).length === 0 && (
                                                        <span className='text-xs text-slate-400'>No dependencies</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-4 py-3 text-sm text-slate-600 flex flex-row gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => openEditModal(subject)}
                                                    className='bg-blue-300 p-0.5 rounded-sm cursor-pointer'
                                                >
                                                    <svg xmlns='http://www.w3.org/2000/svg' height='20px' viewBox='0 -960 960 960' width='20px' fill='#2854C5'>
                                                        <path d='M216-216h51l375-375-51-51-375 375v51Zm-72 72v-153l498-498q11-11 23.84-16 12.83-5 27-5 14.16 0 27.16 5t24 16l51 51q11 11 16 24t5 26.54q0 14.45-5.02 27.54T795-642L297-144H144Zm600-549-51-51 51 51Zm-127.95 76.95L591-642l51 51-25.95-25.05Z' />
                                                    </svg>
                                                </button>

                                                <button
                                                    type='button'
                                                    onClick={() => openDeleteModal(subject)}
                                                    className='bg-red-300 p-0.5 rounded-sm cursor-pointer'
                                                >
                                                    <svg xmlns='http://www.w3.org/2000/svg' height='20px' viewBox='0 -960 960 960' width='20px' fill='#8C1A10'>
                                                        <path d='M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z' />
                                                    </svg>
                                                </button>

                                                <button
                                                    type='button'
                                                    onClick={() => openPrerequisiteModal(subject)}
                                                    className='bg-green-300 p-0.5 rounded-sm cursor-pointer'
                                                >
                                                    <svg xmlns='http://www.w3.org/2000/svg' height='20px' viewBox='0 -960 960 960' width='20px' fill='#2D9C8F'>
                                                        <path d='M216-216h51l375-375-51-51-375 375v51Zm-72 72v-153l498-498q11-11 23.84-16 12.83-5 27-5 14.16 0 27.16 5t24 16l51 51q11 11 16 24t5 26.54q0 14.45-5.02 27.54T795-642L297-144H144Zm600-549-51-51 51 51Zm-127.95 76.95L591-642l51 51-25.95-25.05Z' />
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

            <Modal
                isOpen={isAddOpen}
                onClose={() => {
                    if (isAdding) return
                    setIsAddOpen(false)
                }}
                title='Add Subject'
                size='md'
                footer={
                    <div className='flex items-center justify-end gap-2'>
                        <button
                            type='button'
                            onClick={() => {
                                if (isAdding) return
                                setIsAddOpen(false)
                            }}
                            className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={handleAddSubject}
                            disabled={isAdding}
                            className='rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            {isAdding ? 'Adding...' : 'Add Subject'}
                        </button>
                    </div>
                }
            >
                <div className='space-y-4'>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Course</label>
                        <select
                            value={addForm.courseID}
                            onChange={(e) => setAddForm((prev) => ({ ...prev, courseID: e.target.value }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        >
                            <option value=''>Select a course</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Subject Code</label>
                        <input
                            type='text'
                            value={addForm.code}
                            onChange={(e) => setAddForm((prev) => ({ ...prev, code: e.target.value }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        />
                    </div>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Subject Title</label>
                        <input
                            type='text'
                            value={addForm.title}
                            onChange={(e) => setAddForm((prev) => ({ ...prev, title: e.target.value }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        />
                    </div>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Units</label>
                        <input
                            type='number'
                            value={addForm.units}
                            onChange={(e) => setAddForm((prev) => ({ ...prev, units: Number(e.target.value) }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isEditOpen}
                onClose={() => {
                    if (isSaving) return
                    setIsEditOpen(false)
                    setSelectedSubject(null)
                }}
                title='Edit Subject'
                size='md'
                footer={
                    <div className='flex items-center justify-end gap-2'>
                        <button
                            type='button'
                            onClick={() => {
                                if (isSaving) return
                                setIsEditOpen(false)
                                setSelectedSubject(null)
                            }}
                            className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={handleEditSubject}
                            disabled={isSaving}
                            className='rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                }
            >
                <div className='space-y-4'>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Course</label>
                        <select
                            value={editForm.courseID}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, courseID: e.target.value }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        >
                            <option value=''>Select a course</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Subject Code</label>
                        <input
                            type='text'
                            value={editForm.code}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        />
                    </div>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Subject Title</label>
                        <input
                            type='text'
                            value={editForm.title}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        />
                    </div>
                    <div>
                        <label className='mb-1 block text-sm font-medium text-slate-700'>Units</label>
                        <input
                            type='number'
                            value={editForm.units}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, units: Number(e.target.value) }))}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteOpen}
                onClose={() => {
                    if (deletingId) return
                    setIsDeleteOpen(false)
                    setSelectedSubject(null)
                }}
                title='Delete Subject'
                size='sm'
                footer={
                    <div className='flex items-center justify-end gap-2'>
                        <button
                            type='button'
                            onClick={() => {
                                if (deletingId) return
                                setIsDeleteOpen(false)
                                setSelectedSubject(null)
                            }}
                            className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={handleDeleteSubject}
                            disabled={Boolean(deletingId)}
                            className='rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            {deletingId ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                }
            >
                <p className='text-sm text-slate-600'>
                    Are you sure you want to delete{' '}
                    <span className='font-semibold text-slate-800'>
                        {selectedSubject ? `${selectedSubject.code} - ${selectedSubject.title}` : 'this subject'}
                    </span>
                    ? This action cannot be undone.
                </p>
            </Modal>
            <Modal
                isOpen={isPrerequisiteOpen}
                onClose={() => {
                    if (isAddingPrerequisite) return
                    setIsPrerequisiteOpen(false)
                    setSelectedSubject(null)
                }}
                title={`Manage Prerequisites: ${selectedSubject?.code}`}
                size='md'
                footer={
                    <button
                        type='button'
                        onClick={() => {
                            if (isAddingPrerequisite) return
                            setIsPrerequisiteOpen(false)
                            setSelectedSubject(null)
                        }}
                        className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ml-auto'
                    >
                        Done
                    </button>
                }
            >
                <div className='space-y-4'>
                    {prerequisiteError && (
                        <div className='rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'>
                            {prerequisiteError}
                        </div>
                    )}

                    <div>
                        <label className='mb-2 block text-sm font-medium text-slate-700'>Add Prerequisite</label>
                        <div className='flex gap-2'>
                            <select
                                value={selectedPrerequisiteId}
                                onChange={(e) => setSelectedPrerequisiteId(e.target.value)}
                                className='flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
                            >
                                <option value=''>Select a subject...</option>
                                {getAvailablePrerequisites().map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.code} - {subject.title}
                                    </option>
                                ))}
                            </select>
                            <button
                                type='button'
                                onClick={handleAddPrerequisite}
                                disabled={isAddingPrerequisite || !selectedPrerequisiteId}
                                className='rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60'
                            >
                                {isAddingPrerequisite ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className='mb-2 text-sm font-semibold text-slate-800'>Current Prerequisites</h3>
                        {prerequisites.length === 0 ? (
                            <p className='text-sm text-slate-500'>No prerequisites set yet.</p>
                        ) : (
                            <div className='space-y-2'>
                                {prerequisites.map((prereq) => (
                                    <div
                                        key={prereq.id}
                                        className='flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3'
                                    >
                                        <span className='text-sm text-slate-700'>
                                            {getSubjectLabel(prereq.prerequisiteSubjectID)}
                                        </span>
                                        <button
                                            type='button'
                                            onClick={() => handleDeletePrerequisite(prereq.id)}
                                            className='text-red-600 hover:text-red-800'
                                        >
                                            <svg xmlns='http://www.w3.org/2000/svg' height='18px' viewBox='0 -960 960 960' width='18px' fill='currentColor'>
                                                <path d='m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z' />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </main>
    )
}