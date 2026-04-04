'use client'
import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import { useState } from "react"

const NAV_ITEMS = [
  { label: "Dashboard", section: "main" },
  { label: "Students", section: "main" },
  { label: "Faculty", section: "main" },
  { label: "Courses", section: "main" },
  { label: "Users", section: "management" },
  { label: "Reports", section: "management" },
  { label: "Settings", section: "management" },
]

const AdminSidebar = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activePage, setActivePage] = useState('Dashboard')

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="sticky top-0 h-screen shrink-0 flex flex-col gap-8 bg-white border-r border-gray-100 p-5 w-56">
      {/* Logo */}
      <header className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
          S
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">School Information System</p>
          <p className="text-xs text-gray-400 font-normal">Admin Panel</p>
        </div>
      </header>

      {/* Nav - Main */}
      <nav className="flex flex-col gap-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-300 px-2 mb-1">
          Main
        </p>
        {NAV_ITEMS.filter((i) => i.section === "main").map((item) => (
          <button
            key={item.label}
            onClick={() => setActivePage(item.label)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-all w-full ${
              activePage === item.label
                ? "bg-indigo-50 text-indigo-600 font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                activePage === item.label ? "bg-indigo-500" : "bg-gray-300"
              }`}
            />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Nav - Management */}
      <nav className="flex flex-col gap-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-300 px-2 mb-1">
          Management
        </p>
        {NAV_ITEMS.filter((i) => i.section === "management").map((item) => (
          <button
            key={item.label}
            onClick={() => setActivePage(item.label)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-all w-full ${
              activePage === item.label
                ? "bg-indigo-50 text-indigo-600 font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                activePage === item.label ? "bg-indigo-500" : "bg-gray-300"
              }`}
            />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Admin Avatar */}
      <div className="mt-auto">
        <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800">{user?.email || 'Admin'}</p>
            <p className="text-[11px] text-gray-400">{user?.role || 'Admin'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-100 p-2 rounded-lg flex items-center gap-2.5 mt-1 cursor-pointer hover:bg-red-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EA3323"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
          <p className="text-red-500 font-bold text-xs">Logout</p>
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar