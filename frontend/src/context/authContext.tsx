"use client"
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  role: 'Student' | 'Faculty' | 'Admin'
  createdDate: string
  updatedDate: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      setToken(storedToken)
      verifyToken(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  // Verify token and fetch user info
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Normalize role to capitalized format
        const normalizedUser = {
          ...data.user,
          role: data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1)
        }
        setUser(normalizedUser)
        setupInactivityTimer()
      } else {
        // Token is invalid, clear it and redirect to login
        localStorage.removeItem('authToken')
        setToken(null)
        setUser(null)
        router.push('/login')
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('authToken')
      setToken(null)
      setUser(null)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Setup inactivity timer
  const setupInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    // Set new timer
    inactivityTimerRef.current = setTimeout(() => {
      handleInactivityLogout()
    }, INACTIVITY_TIMEOUT)
  }

  // Reset inactivity timer on user activity
  const resetInactivityTimer = () => {
    if (user && token) {
      setupInactivityTimer()
    }
  }

  // Handle inactivity logout
  const handleInactivityLogout = () => {
    console.log('User inactive for 15 minutes. Logging out...')
    logout()
    router.push('/login')
  }

  // Attach activity listeners
  useEffect(() => {
    if (!user || !token) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer)
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer)
      })
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [user, token])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Login failed')
      }

      const data = await response.json()
      const newToken = data.token

      // Normalize role to capitalized format
      const normalizedUser = {
        ...data.user,
        role: data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1)
      }

      setToken(newToken)
      setUser(normalizedUser)  // ✅ Now normalized
      localStorage.setItem('authToken', newToken)
      setupInactivityTimer()
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}