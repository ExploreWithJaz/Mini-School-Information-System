import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export type UserRole = 'Student' | 'Faculty' | 'Admin'

interface ProtectionOptions {
  requiredRoles?: UserRole[]
  redirectToHome?: boolean
}

/**
 * Hook to protect routes based on authentication and role
 * 
 * @param options.requiredRoles - Array of roles allowed to access this route
 * @param options.redirectToHome - If true, redirects unauthorized users to /, otherwise to /login
 * 
 * @example
 * // Admin only
 * useRouteProtection({ requiredRoles: ['Admin'] })
 * 
 * @example
 * // Students and Faculty (not Admin)
 * useRouteProtection({ requiredRoles: ['Student', 'Faculty'] })
 * 
 * @example
 * // Any authenticated user
 * useRouteProtection({})
 */
export function useRouteProtection(options: ProtectionOptions = {}) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { requiredRoles = [], redirectToHome = false } = options

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return

    // If roles specified, enforce role-based access
    if (requiredRoles.length > 0) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }

      if (!requiredRoles.includes(user.role)) {
        router.push(redirectToHome ? '/' : '/login')
        return
      }
    } else {
      // No specific roles = any authenticated user required
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
    }
  }, [user, isAuthenticated, loading, requiredRoles, redirectToHome, router])

  return {
    user,
    isAuthenticated,
    loading,
    hasAccess: !loading && Boolean(
      !requiredRoles.length
        ? isAuthenticated
        : isAuthenticated && user && requiredRoles.includes(user.role)
    ),
  }
}
