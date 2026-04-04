'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiCall, API_URL } from '@/lib/api'

interface Student {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  birthDate: Date
  courseId: string
  createdAt: Date
  updatedAt: Date
}

interface PaginationResponse {
  data: Student[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
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
      setStudents(response.data)
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Student Management</h1>
        <p className='text-gray-500'>View and manage all students in the system</p>
      </div>

      {/* Search and Filter */}
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
            <option value='1'>Bachelor of Science in Computer Science</option>
            <option value='2'>Bachelor of Science in Electronics Engineering</option>
            <option value='3'>Bachelor of Science in Information Technology</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
                      <td className='px-6 py-4 text-center'>
                        <button
                          onClick={() => handleViewStudent(student.id)}
                          className='inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-all'
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                        pagination.page === page
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
    </section>
  )
}
