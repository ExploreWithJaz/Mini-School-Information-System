'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/sidebar'
import AdminSidebar from '@/components/adminSidebar'
import Dashboard from '../pages/dashboard/index'
import AdminDashboard from '../pages/adminDashboard/index'
import Enrollment from '../pages/enrollment/index'

function Page() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [activePage, setActivePage] = useState('Student Profile')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Render different layouts based on user role
  if (user.role === 'Admin') {
    return (
      <div className="h-screen flex flex-row overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 h-full overflow-y-auto">
          <AdminDashboard />
        </main>
      </div>
    )
  }

  // Faculty and Student use the same dashboard for now
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