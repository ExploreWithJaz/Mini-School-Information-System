'use client'
import React, { useState } from 'react'
import Sidebar from '../components/sidebar'
import Dashboard from '../pages/dashboard/index'
import Enrollment from '../pages/enrollment/index'

function Page() {
  const [activePage, setActivePage] = useState('Student Profile')

  const renderPage = () => {
    switch (activePage) {
      case 'Enrollment':
        return <Enrollment />
      case 'Student Profile':
      case 'Performance':
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="h-screen flex flex-row overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 h-full overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}

export default Page