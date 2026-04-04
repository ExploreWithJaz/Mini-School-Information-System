'use client'
import { useState } from 'react'

const TABS = ['Overview', 'Grades', 'Prerequisites']

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>
      <h1>Admin Dashboard</h1>
      {/* Student Basic Information */}
      <div className='flex flex-row justify-start items-center gap-40 bg-white p-10 rounded-xl border border-gray-100 mb-5'>
        <div className='flex flex-row gap-10 items-center'>
          <img
            className='w-32 h-32 rounded-full border border-gray-100 object-cover'
            src='https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'
            alt='Student Profile'
          />
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>Garcia</h2>
            <p className='text-xl text-gray-500 font-light'>Jazper Tolentino</p>
            <span className='mt-2 inline-block text-[11px] font-medium px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100'>
              Active
            </span>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <p className='text-sm'><span className='text-gray-400'>Student ID</span> <span className='ml-3 font-medium text-gray-800'>123456</span></p>
          <p className='text-sm'><span className='text-gray-400'>Date of Birth</span> <span className='ml-3 font-medium text-gray-800'>January 1, 2000</span></p>
          <p className='text-sm'><span className='text-gray-400'>Gender</span> <span className='ml-3 font-medium text-gray-800'>Male</span></p>
          <p className='text-sm'><span className='text-gray-400'>Course</span> <span className='ml-3 font-medium text-gray-800'>Bachelor of Science in Computer Science (BSCS)</span></p>
          <p className='text-sm'><span className='text-gray-400'>Year Level</span> <span className='ml-3 font-medium text-gray-800'>2nd Year</span></p>
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
                {/* map your enrolled subjects here */}
                <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                  <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS101</td>
                  <td className='px-4 py-3.5 text-sm text-gray-800'>Introduction to Computing</td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>3 units</span></td>
                </tr>
                <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                  <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS102</td>
                  <td className='px-4 py-3.5 text-sm text-gray-800'>Programming Fundamentals</td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>4 units</span></td>
                </tr>
                <tr className='hover:bg-gray-50 transition-colors'>
                  <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>MATH201</td>
                  <td className='px-4 py-3.5 text-sm text-gray-800'>Discrete Mathematics</td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>3 units</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Reserved Subjects */}
          <div className='bg-white p-5 rounded-xl border border-gray-100'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-medium text-gray-900'>Reserved Subjects</h2>
              <span className='text-[11px] font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100'>Pending Approval</span>
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
                {/* map your reserved subjects here */}
                <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                  <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS201</td>
                  <td className='px-4 py-3.5 text-sm text-gray-800'>Data Structures and Algorithms</td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>3 units</span></td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600'>Reserved</span></td>
                </tr>
                <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                  <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS202</td>
                  <td className='px-4 py-3.5 text-sm text-gray-800'>Object-Oriented Programming</td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>3 units</span></td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-500'>Under Review</span></td>
                </tr>
                <tr className='hover:bg-gray-50 transition-colors'>
                  <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>MATH202</td>
                  <td className='px-4 py-3.5 text-sm text-gray-800'>Linear Algebra</td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600'>3 units</span></td>
                  <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600'>Reserved</span></td>
                </tr>
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
              {/* map your grades here */}
              <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS101</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Introduction to Computing</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>88</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>91</td>
                <td className='px-4 py-3.5 text-center text-sm font-medium text-gray-900'>89.5</td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700'>Passed</span></td>
              </tr>
              <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS102</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Programming Fundamentals</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>92</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>94</td>
                <td className='px-4 py-3.5 text-center text-sm font-medium text-gray-900'>93.0</td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700'>Passed</span></td>
              </tr>
              <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>MATH201</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Discrete Mathematics</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>78</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>80</td>
                <td className='px-4 py-3.5 text-center text-sm font-medium text-gray-900'>79.0</td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700'>Passed</span></td>
              </tr>
              <tr className='hover:bg-gray-50 transition-colors'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>ENG101</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Technical Communication</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>55</td>
                <td className='px-4 py-3.5 text-center text-sm text-gray-700'>58</td>
                <td className='px-4 py-3.5 text-center text-sm font-medium text-gray-900'>56.5</td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-500'>Failed</span></td>
              </tr>
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
              {/* map your prerequisite data here */}
              <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS201</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Data Structures and Algorithms</td>
                <td className='px-4 py-3.5'>
                  <div className='flex gap-1 flex-wrap'>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>CS101</span>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>CS102</span>
                  </div>
                </td>
                <td className='px-4 py-3.5 text-sm text-gray-400'>—</td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700'>Eligible</span></td>
              </tr>
              <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS202</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Object-Oriented Programming</td>
                <td className='px-4 py-3.5'>
                  <div className='flex gap-1 flex-wrap'>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>CS102</span>
                  </div>
                </td>
                <td className='px-4 py-3.5 text-sm text-gray-400'>—</td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700'>Eligible</span></td>
              </tr>
              <tr className='hover:bg-gray-50 transition-colors border-b border-gray-50'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>CS301</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Database Management Systems</td>
                <td className='px-4 py-3.5'>
                  <div className='flex gap-1 flex-wrap'>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>CS201</span>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>CS202</span>
                  </div>
                </td>
                <td className='px-4 py-3.5'>
                  <div className='flex gap-1 flex-wrap'>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400'>CS201</span>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400'>CS202</span>
                  </div>
                </td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-500'>Not Eligible</span></td>
              </tr>
              <tr className='hover:bg-gray-50 transition-colors'>
                <td className='px-4 py-3.5 text-xs font-medium text-gray-700'>MATH301</td>
                <td className='px-4 py-3.5 text-sm text-gray-800'>Calculus II</td>
                <td className='px-4 py-3.5'>
                  <div className='flex gap-1 flex-wrap'>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>MATH201</span>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>MATH202</span>
                  </div>
                </td>
                <td className='px-4 py-3.5'>
                  <div className='flex gap-1 flex-wrap'>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400'>MATH202</span>
                  </div>
                </td>
                <td className='px-4 py-3.5 text-center'><span className='text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-500'>Not Eligible</span></td>
              </tr>
            </tbody>
          </table>
          <p className='text-xs text-gray-400 mt-3'>Missing prerequisites shown in red must be completed before enrolling.</p>
        </div>
      )}

    </section>
  )
}