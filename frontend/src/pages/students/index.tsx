'use client'
import { useEffect, useState } from 'react'
import { apiCall } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Modal from '@/components/modal'

interface Student {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  courseId: string
  createdAt: string
  updatedAt: string
}

interface StudentApi {
  id: string
  student_number: string
  first_name: string
  last_name: string
  email: string
  birth_date: string
  course_id: string
  created_at: string
  updated_at: string
}

type CourseOption = {
  id: string
  code: string
  name: string
}

type StudentForm = {
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  courseId: string
}

export default function Students() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState<StudentForm>({
    studentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    courseId: ''
  })
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const [showImportResults, setShowImportResults] = useState(false)

  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '10')
      if (search) params.append('search', search)
      if (courseId) params.append('courseId', courseId)

      const response = await apiCall(`/students?${params.toString()}`)

      const mappedStudents: Student[] = (response.data as StudentApi[]).map((s) => ({
        id: s.id,
        studentNumber: s.student_number,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        birthDate: s.birth_date,
        courseId: s.course_id,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }))

      setStudents(mappedStudents)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, courseId])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleViewStudent = (studentId: string) => {
    router.push(`/students/${studentId}`)
  }

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      fetchStudents(pagination.page - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchStudents(pagination.page + 1)
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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiCall('/courses')
        setCourses(
          (response as Array<{ id: string; code: string; name: string }>).map((course) => ({
            id: course.id,
            code: course.code,
            name: course.name
          }))
        )
      } catch {
        setCourses([])
      }
    }

    fetchCourses()
  }, [])

  const toDateInputValue = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  const openEditModal = (student: Student) => {
    setSelectedStudent(student)
    setEditForm({
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      birthDate: toDateInputValue(student.birthDate),
      courseId: student.courseId
    })
    setIsEditOpen(true)
  }

  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student)
    setIsDeleteOpen(true)
  }

  const handleEditStudent = async () => {
    if (!selectedStudent) return

    try {
      setIsSaving(true)
      setError(null)

      const updated = (await apiCall(`/students/${selectedStudent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          studentNumber: editForm.studentNumber.trim(),
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim(),
          birthDate: editForm.birthDate,
          courseId: editForm.courseId
        })
      })) as Student

      setStudents((prev) =>
        prev.map((student) => (student.id === updated.id ? updated : student))
      )

      setIsEditOpen(false)
      setSelectedStudent(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return

    try {
      setIsDeleting(true)
      setError(null)

      await apiCall(`/students/${selectedStudent.id}`, {
        method: 'DELETE'
      })

      setStudents((prev) => prev.filter((student) => student.id !== selectedStudent.id))
      setIsDeleteOpen(false)
      setSelectedStudent(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleImportCSV = async () => {
    if (!importFile) {
      setError('Please select a file')
      return
    }

    try {
      setIsImporting(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/import`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Import failed')
        return
      }

      setImportResults(data.results)
      setShowImportResults(true)
      setImportFile(null)
      setIsImportOpen(false)

      // Refresh student list
      setTimeout(() => {
        fetchStudents(1)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadSampleCSV = () => {
    const sample = `student_number,first_name,last_name,email,birth_date,course_id
STU001,John,Doe,john.doe@example.com,2000-01-15,COURSE_ID_HERE
STU002,Jane,Smith,jane.smith@example.com,2000-02-20,COURSE_ID_HERE
STU003,Bob,Johnson,bob.johnson@example.com,2000-03-10,COURSE_ID_HERE`

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(sample))
    element.setAttribute('download', 'sample_students.csv')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Student Management</h1>
        <p className='text-gray-500'>View and manage all students in the system</p>
      </div>

      <div className='bg-white p-5 rounded-xl border border-gray-100 mb-5 flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Search Students</label>
          <input
            type='text'
            placeholder='Search by name, student number, or email...'
            value={search}
            onChange={handleSearch}
            className='w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
          />
        </div>
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className='w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
          >
            <option value=''>All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
        <div className='flex flex-col'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Actions</label>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setIsImportOpen(true)}
              className='px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer'
            >
              Import CSV
            </button>
            <button
              type='button'
              onClick={() => router.push('/students/add')}
              className='px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer'
            >
              Add Student
            </button>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl border border-gray-100 overflow-hidden'>
        {loading ? (
          <div className='flex items-center justify-center p-10'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4'></div>
              <p className='text-gray-500'>Loading students...</p>
            </div>
          </div>
        ) : error ? (
          <div className='p-10'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-red-700 text-sm font-medium'>{error}</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className='flex items-center justify-center p-10'>
            <div className='text-center'>
              <p className='text-gray-500 text-sm'>No students found</p>
            </div>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-gray-50 border-b border-gray-100'>
                    <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Student Number</th>
                    <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Full Name</th>
                    <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Email</th>
                    <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Date of Birth</th>
                    <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Status</th>
                    <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className='border-b border-gray-50 hover:bg-gray-50 transition-colors'>
                      <td className='px-6 py-4 text-xs font-medium text-gray-700'>
                        {student.studentNumber}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-800 font-medium'>
                        {student.firstName} {student.lastName}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {student.email}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {formatDate(student.birthDate)}
                      </td>
                      <td className='px-6 py-4 text-center'>
                        <span className='inline-block text-[11px] font-medium px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100'>
                          Active
                        </span>
                      </td>
                      <td className='px-6 py-4 text-center flex flex-row items-center justify-center gap-2'>
                        <button
                          type='button'
                          onClick={() => openEditModal(student)}
                          className='bg-blue-300 p-0.5 rounded-sm cursor-pointer'
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' height='20px' viewBox='0 -960 960 960' width='20px' fill='#2854C5'>
                            <path d='M216-216h51l375-375-51-51-375 375v51Zm-72 72v-153l498-498q11-11 23.84-16 12.83-5 27-5 14.16 0 27.16 5t24 16l51 51q11 11 16 24t5 26.54q0 14.45-5.02 27.54T795-642L297-144H144Zm600-549-51-51 51 51Zm-127.95 76.95L591-642l51 51-25.95-25.05Z'/></svg>
                        </button>

                        <button
                          type='button'
                          onClick={() => openDeleteModal(student)}
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

            <div className='flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100'>
              <p className='text-sm text-gray-600'>
                Showing <span className='font-medium'>{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className='font-medium'>
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className='font-medium'>{pagination.total}</span> students
              </p>
              <div className='flex gap-2'>
                <button
                  onClick={handlePreviousPage}
                  disabled={pagination.page === 1}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                >
                  Previous
                </button>
                <div className='flex items-center gap-1'>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchStudents(page)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${pagination.page === page
                          ? 'bg-indigo-500 text-white'
                          : 'text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          if (isSaving) return
          setIsEditOpen(false)
          setSelectedStudent(null)
        }}
        title='Edit Student'
        size='lg'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (isSaving) return
                setIsEditOpen(false)
                setSelectedStudent(null)
              }}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleEditStudent}
              disabled={isSaving}
              className='rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Student Number</label>
            <input
              type='text'
              value={editForm.studentNumber}
              onChange={(e) => setEditForm((prev) => ({ ...prev, studentNumber: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Email</label>
            <input
              type='email'
              value={editForm.email}
              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>First Name</label>
            <input
              type='text'
              value={editForm.firstName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Last Name</label>
            <input
              type='text'
              value={editForm.lastName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Birth Date</label>
            <input
              type='date'
              value={editForm.birthDate}
              onChange={(e) => setEditForm((prev) => ({ ...prev, birthDate: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>Course</label>
            <select
              value={editForm.courseId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, courseId: e.target.value }))}
              className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400'
            >
              <option value=''>Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (isDeleting) return
          setIsDeleteOpen(false)
          setSelectedStudent(null)
        }}
        title='Delete Student'
        size='sm'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (isDeleting) return
                setIsDeleteOpen(false)
                setSelectedStudent(null)
              }}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className='rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className='text-sm text-slate-600'>
          Are you sure you want to delete{' '}
          <span className='font-semibold text-slate-800'>
            {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'this student'}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          if (isImporting) return
          setIsImportOpen(false)
          setImportFile(null)
        }}
        title='Import Students from CSV'
        size='lg'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                if (isImporting) return
                setIsImportOpen(false)
                setImportFile(null)
              }}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleImportCSV}
              disabled={isImporting || !importFile}
              className='rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        }
      >
        <div className='space-y-4'>
          <div>
            <h3 className='font-medium text-slate-900 mb-2'>CSV Format</h3>
            <p className='text-sm text-slate-600 mb-3'>Required columns:</p>
            <div className='bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-700 mb-4'>
              student_number, first_name, last_name, email, birth_date, course_id
            </div>
            <p className='text-xs text-slate-500 mb-3'>Date format: YYYY-MM-DD (e.g., 2000-01-15)</p>
            <button
              type='button'
              onClick={downloadSampleCSV}
              className='text-sm text-indigo-600 hover:text-indigo-700 font-medium'
            >
              ↓ Download Sample CSV
            </button>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>Select File</label>
            <input
              type='file'
              accept='.csv'
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className='w-full px-3 py-2 border border-slate-200 rounded-lg text-sm'
            />
            {importFile && (
              <p className='text-xs text-slate-600 mt-2'>Selected: {importFile.name}</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Import Results Modal */}
      <Modal
        isOpen={showImportResults}
        onClose={() => setShowImportResults(false)}
        title='Import Results'
        size='lg'
        footer={
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => setShowImportResults(false)}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              Close
            </button>
          </div>
        }
      >
        {importResults && (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-green-50 p-4 rounded-lg'>
                <p className='text-sm text-green-700 font-medium'>Success</p>
                <p className='text-2xl font-bold text-green-600'>{importResults.success}</p>
              </div>
              <div className='bg-red-50 p-4 rounded-lg'>
                <p className='text-sm text-red-700 font-medium'>Failed</p>
                <p className='text-2xl font-bold text-red-600'>{importResults.failed}</p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div>
                <h3 className='font-medium text-slate-900 mb-2'>Errors</h3>
                <div className='space-y-2 max-h-64 overflow-y-auto'>
                  {importResults.errors.map((error: any, idx: number) => (
                    <div key={idx} className='bg-red-50 p-3 rounded text-sm text-red-700'>
                      <p className='font-medium'>
                        {error.studentNumber ? `${error.studentNumber} - ` : `Row ${error.row}: `}
                        {error.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
