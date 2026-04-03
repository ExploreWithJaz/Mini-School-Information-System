import { useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/router'

type Role = 'Student' | 'Faculty' | 'Admin'

const ROLES: Role[] = ['Student', 'Faculty', 'Admin']

const ROLE_LABELS: Record<Role, string> = {
  Student: 'User ID/Email',
  Faculty: 'Faculty ID',
  Admin: 'Username',
}

const ROLE_PLACEHOLDERS: Record<Role, string> = {
  Student: 'e.g. student@example.com',
  Faculty: 'e.g. faculty@example.com',
  Admin: 'e.g. admin@example.com',
}

export default function LoginPage() {
  const [role, setRole] = useState<Role>('Student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Redirect to dashboard on successful login
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#f4f6fb] flex items-center justify-center p-6'>
      <div className='bg-white border border-gray-100 rounded-2xl p-10 w-full max-w-sm'>
        <h1 className='text-xl font-bold text-gray-900 mb-6'>School Information System</h1>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {/* Error Message */}
          {error && (
            <div className='p-3 rounded-lg bg-red-50 border border-red-200'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className='block text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-1.5'>
              {ROLE_LABELS[role]}
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ROLE_PLACEHOLDERS[role]}
              required
              className='w-full px-3.5 py-2.5 rounded-lg border border-gray-100 bg-[#f8f9fd] text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400 focus:bg-white transition-all'
            />
          </div>

          {/* Password Field */}
          <div>
            <div className='flex justify-between items-center mb-1.5'>
              <label className='text-[10px] font-medium uppercase tracking-widest text-gray-400'>
                Password
              </label>
              <a href='#' className='text-xs text-indigo-500 hover:text-indigo-600'>
                Forgot password?
              </a>
            </div>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
              required
              className='w-full px-3.5 py-2.5 rounded-lg border border-gray-100 bg-[#f8f9fd] text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400 focus:bg-white transition-all'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full py-2.5 rounded-lg bg-[#1a1f36] hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors mt-1'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className='text-center text-xs text-gray-400 mt-5'>
          Need help?{' '}
          <a href='#' className='text-indigo-500 hover:text-indigo-600'>
            Contact the Registrar&apos;s Office
          </a>
        </p>
      </div>
    </div>
  )
}