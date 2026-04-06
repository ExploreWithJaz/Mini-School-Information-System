'use client'
import { useEffect, useMemo, useState } from 'react'
import { apiCall } from '@/lib/api'
import Modal from '@/components/modal'
import { useRouteProtection } from '@/hooks/useRouteProtection'

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
  const { hasAccess } = useRouteProtection({ 
    requiredRoles: ['Faculty', 'Admin'] 
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [addForm, setAddForm] = useState({ code: '', name: '', description: '' })
  const [editForm, setEditForm] = useState({ code: '', name: '', description: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [isSavingInline, setIsSavingInline] = useState(false)

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false)
      return
    }

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
  }, [hasAccess])

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

  if (!hasAccess) return null
  if (loading) return <div className='flex items-center justify-center min-h-screen'>Loading...</div>

  const formatDate = (value: string) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const openAddModal = () => {
    setAddForm({ code: '', name: '', description: '' })
    setIsAddOpen(true)
  }

  const handleAddCourse = async () => {
    const code = addForm.code.trim()
    const name = addForm.name.trim()
    const description = addForm.description.trim()

    if (!code || !name) {
      setError('Course code and name are required')
      return
    }

    try {
      setIsAdding(true)
      setError(null)
      const created = (await apiCall('/courses', {
        method: 'POST',
        body: JSON.stringify({ code, name, description })
      })) as CourseApi

      const createdCourse: Course = {
        id: created.id,
        code: created.code,
        name: created.name,
        description: created.description ?? 'No description provided',
        createdAt: created.created_at,
        updatedAt: created.updated_at
      }

      setCourses((prev) => [createdCourse, ...prev])
      setIsAddOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add course')
    } finally {
      setIsAdding(false)
    }
  }

  const openDeleteModal = (course: Course) => {
    setSelectedCourse(course)
    setIsDeleteOpen(true)
  }

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return

    try {
      setDeletingId(selectedCourse.id)
      setError(null)
      await apiCall(`/courses/${selectedCourse.id}`, { method: 'DELETE' })
      setCourses((prev) => prev.filter((course) => course.id !== selectedCourse.id))
      setIsDeleteOpen(false)
      setSelectedCourse(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course')
    } finally {
      setDeletingId(null)
    }
  }

  const openEditModal = (course: Course) => {
    setSelectedCourse(course)
    setEditForm({
      code: course.code,
      name: course.name,
      description: course.description
    })
    setIsEditOpen(true)
  }

  const handleEditCourse = async () => {
    if (!selectedCourse) return

    const code = editForm.code.trim()
    const name = editForm.name.trim()
    const description = editForm.description.trim()

    if (!code || !name) {
      setError('Course code and name are required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      const updated = (await apiCall(`/courses/${selectedCourse.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          code,
          name,
          description
        })
      })) as CourseApi

      setCourses((prev) =>
        prev.map((item) =>
          item.id === selectedCourse.id
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

      setIsEditOpen(false)
      setSelectedCourse(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course')
    } finally {
      setIsSaving(false)
    }
  }

    const handleSelectAllCourses = (checked: boolean) => {
    if (checked) {
      setSelectedCourseIds(new Set(filteredCourses.map(c => c.id)))
    } else {
      setSelectedCourseIds(new Set())
    }
  }

  const handleSelectCourse = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCourseIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedCourseIds(newSelected)
  }

  const handleBulkDeleteCourses = async () => {
    if (selectedCourseIds.size === 0) return

    try {
      setIsBulkDeleting(true)
      setError(null)

      const deletePromises = Array.from(selectedCourseIds).map(id =>
        apiCall(`/courses/${id}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      setCourses((prev) =>
        prev.filter((course) => !selectedCourseIds.has(course.id))
      )
      setSelectedCourseIds(new Set())
      setBulkDeleteOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete courses')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const startInlineEdit = (courseId: string, field: string, currentValue: string) => {
    setEditingId(courseId)
    setEditingField(field)
    setEditingValue(currentValue)
  }

  const cancelInlineEdit = () => {
      setEditingId(null)
      setEditingField(null)
      setEditingValue('')
  }

  const saveInlineEdit = async (courseId: string, field: string) => {
      if (!editingValue.trim()) {
          setError(`${field} cannot be empty`)
          return
      }

      try {
          setIsSavingInline(true)
          setError(null)

          const course = courses.find(c => c.id === courseId)
          if (!course) return

            const updatePayload: { code: string; name: string; description: string } = {
              code: field === 'code' ? editingValue.trim() : course.code,
              name: field === 'name' ? editingValue.trim() : course.name,
              description: field === 'description' ? editingValue.trim() : course.description
          }

          const updated = (await apiCall(`/courses/${courseId}`, {
              method: 'PATCH',
              body: JSON.stringify(updatePayload)
          })) as CourseApi

          setCourses((prev) =>
              prev.map((item) =>
                  item.id === courseId
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
          
          cancelInlineEdit()
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update course')
      } finally {
          setIsSavingInline(false)
      }
  }

  const handleInlineKeyDown = (e: React.KeyboardEvent, courseId: string, field: string) => {
      if (e.key === 'Enter') {
          saveInlineEdit(courseId, field)
      } else if (e.key === 'Escape') {
          cancelInlineEdit()
      }
  }

  return (
    <main className='min-h-screen bg-slate-50 p-6 md:p-8'>
      <div className='mx-auto space-y-6'>
        <header className='flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>Courses</h1>
            <p className='mt-1 text-sm text-slate-500'>
              Browse and manage available programs in the database.
            </p>
          </div>
          <div className='flex gap-2'>
            {selectedCourseIds.size > 0 && (
              <>
                <button
                  type='button'
                  onClick={() => setBulkDeleteOpen(true)}
                  className='inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700'
                >
                  Delete ({selectedCourseIds.size})
                </button>
                <button
                  type='button'
                  onClick={() => setSelectedCourseIds(new Set())}
                  className='inline-flex items-center justify-center rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-400'
                >
                  Clear
                </button>
              </>
            )}
            <button
              type='button'
              onClick={openAddModal}
              className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800'
            >
              + Add Course
            </button>
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
                  className='rounded-xl border border-slate-200 bg-white p-5 pl-8 transition hover:shadow-sm relative'
                >
                  <input
                    type='checkbox'
                    checked={selectedCourseIds.has(course.id)}
                    onChange={(e) => handleSelectCourse(course.id, e.target.checked)}
                    className='absolute top-4.5 left-2 w-4 h-4 cursor-pointer'
                  />
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-xs font-semibold tracking-wide text-slate-500'>
                        {editingId === course.id && editingField === 'code' ? (
                          <input
                            type='text'
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => handleInlineKeyDown(e, course.id, 'code')}
                            onBlur={() => saveInlineEdit(course.id, 'code')}
                            className='w-32 rounded border border-indigo-500 px-2 py-1 text-xs outline-none'
                          />
                        ) : (
                          <span
                            onClick={() => startInlineEdit(course.id, 'code', course.code)}
                            className='cursor-pointer hover:bg-yellow-100 rounded px-2 py-1 transition'
                            title='Click to edit code'
                          >
                            {course.code}
                          </span>
                        )}
                      </p>
                      <h2 className='mt-1 text-base font-semibold text-slate-900'>
                        {editingId === course.id && editingField === 'name' ? (
                          <input
                            type='text'
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => handleInlineKeyDown(e, course.id, 'name')}
                            onBlur={() => saveInlineEdit(course.id, 'name')}
                            className='w-full rounded border border-indigo-500 px-2 py-1 text-base outline-none'
                          />
                        ) : (
                          <span
                            onClick={() => startInlineEdit(course.id, 'name', course.name)}
                            className='cursor-pointer hover:bg-yellow-100 rounded px-2 py-1 transition'
                            title='Click to edit name'
                          >
                            {course.name}
                          </span>
                        )}
                      </h2>
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
                      onClick={() => openEditModal(course)}
                      className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50'
                    >
                      Edit All
                    </button>
                    <button
                      type='button'
                      onClick={() => openDeleteModal(course)}
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

      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          if (isAdding) return
          setIsAddOpen(false)
        }}
        title='Add Course'
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
              onClick={handleAddCourse}
              disabled={isAdding}
              className='rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isAdding ? 'Adding...' : 'Add Course'}
            </button>
          </div>
        }
      >
        <div className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Course Code</label>
            <input
              type='text'
              value={addForm.code}
              onChange={(e) => setAddForm((prev) => ({ ...prev, code: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Course Name</label>
            <input
              type='text'
              value={addForm.name}
              onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Description</label>
            <textarea
              rows={4}
              value={addForm.description}
              onChange={(e) => setAddForm((prev) => ({ ...prev, description: e.target.value }))}
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
          setSelectedCourse(null)
        }}
        title='Edit Course'
        size='md'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (isSaving) return
                setIsEditOpen(false)
                setSelectedCourse(null)
              }}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleEditCourse}
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
            <label className='mb-1 block text-sm font-medium text-slate-700'>Course Code</label>
            <input
              type='text'
              value={editForm.code}
              onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Course Name</label>
            <input
              type='text'
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Description</label>
            <textarea
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
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
          setSelectedCourse(null)
        }}
        title='Delete Course'
        size='sm'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (deletingId) return
                setIsDeleteOpen(false)
                setSelectedCourse(null)
              }}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleDeleteCourse}
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
            {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : 'this course'}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
            <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => {
          if (isBulkDeleting) return
          setBulkDeleteOpen(false)
        }}
        title='Bulk Delete Courses'
        size='sm'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (isBulkDeleting) return
                setBulkDeleteOpen(false)
              }}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleBulkDeleteCourses}
              disabled={isBulkDeleting}
              className='rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete All'}
            </button>
          </div>
        }
      >
        <p className='text-sm text-slate-600'>
          Are you sure you want to delete <span className='font-semibold'>{selectedCourseIds.size} course(s)</span>? This action cannot be undone.
        </p>
      </Modal>
    </main>
  )
}
