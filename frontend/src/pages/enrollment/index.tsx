'use client'
import { useState } from 'react'

const COURSES = [
  {
    id: 'cs',
    name: 'Bachelor of Science in Computer Science',
    code: 'BSCS',
    description: 'A comprehensive program focusing on software development and computer systems',
    subjects: [
      { code: 'CS101', name: 'Introduction to Computing', units: 3, semester: '1st' },
      { code: 'CS102', name: 'Programming Fundamentals', units: 4, semester: '1st' },
      { code: 'CS201', name: 'Data Structures and Algorithms', units: 3, semester: '2nd' },
      { code: 'CS202', name: 'Object-Oriented Programming', units: 3, semester: '2nd' },
      { code: 'CS301', name: 'Database Management Systems', units: 3, semester: '3rd' },
    ],
  },
  {
    id: 'eng',
    name: 'Bachelor of Science in Electronics Engineering',
    code: 'BSEE',
    description: 'Study of electrical systems, electronics, and power engineering',
    subjects: [
      { code: 'ENG101', name: 'Circuit Analysis', units: 4, semester: '1st' },
      { code: 'ENG102', name: 'Digital Logic Design', units: 3, semester: '1st' },
      { code: 'ENG201', name: 'Microprocessors', units: 4, semester: '2nd' },
      { code: 'ENG202', name: 'Signal Processing', units: 3, semester: '2nd' },
    ],
  },
  {
    id: 'info',
    name: 'Bachelor of Science in Information Technology',
    code: 'BSIT',
    description: 'Focus on IT infrastructure, network administration, and systems management',
    subjects: [
      { code: 'IT101', name: 'Fundamentals of IT', units: 3, semester: '1st' },
      { code: 'IT102', name: 'Computer Networks', units: 4, semester: '1st' },
      { code: 'IT201', name: 'Network Administration', units: 3, semester: '2nd' },
      { code: 'IT202', name: 'Database Systems', units: 3, semester: '2nd' },
      { code: 'IT301', name: 'Cloud Computing', units: 3, semester: '3rd' },
    ],
  },
]

export default function Enrollment() {
  const [expandedCourse, setExpandedCourse] = useState<string | null>('cs')

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Course Enrollment</h1>
        <p className='text-gray-500'>Browse available courses and subjects for enrollment</p>
      </div>

      <div className='flex flex-col gap-4'>
        {COURSES.map((course) => (
          <div key={course.id} className='bg-white border border-gray-100 rounded-xl overflow-hidden'>
            {/* Course Header */}
            <button
              onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
              className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
            >
              <div className='flex flex-col items-start gap-1'>
                <h2 className='text-base font-semibold text-gray-900'>{course.name}</h2>
                <p className='text-xs text-gray-400'>{course.description}</p>
              </div>
              <div className='flex items-center gap-4'>
                <span className='text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100'>
                  {course.code}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedCourse === course.id ? 'rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
                </svg>
              </div>
            </button>

            {/* Subjects Table */}
            {expandedCourse === course.id && (
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
                        Semester
                      </th>
                      <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3 border-b border-gray-100'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.subjects.map((subject, idx) => (
                      <tr
                        key={subject.code}
                        className={`hover:bg-gray-50 transition-colors ${
                          idx < course.subjects.length - 1 ? 'border-b border-gray-50' : ''
                        }`}
                      >
                        <td className='px-6 py-3.5 text-xs font-medium text-gray-700'>{subject.code}</td>
                        <td className='px-6 py-3.5 text-sm text-gray-800'>{subject.name}</td>
                        <td className='px-6 py-3.5 text-center'>
                          <span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>
                            {subject.units} units
                          </span>
                        </td>
                        <td className='px-6 py-3.5 text-center text-sm text-gray-600'>{subject.semester}</td>
                        <td className='px-6 py-3.5 text-center'>
                          <button className='text-xs font-medium px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors'>
                            Enroll
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}