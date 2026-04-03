import { useState } from 'react'

type Role = 'Student' | 'Faculty' | 'Admin'

const ROLES: Role[] = ['Student', 'Faculty', 'Admin']

const ROLE_LABELS: Record<Role, string> = {
  Student: 'User ID/Email',
  Faculty: 'Faculty ID',
  Admin: 'Username',
}

const ROLE_PLACEHOLDERS: Record<Role, string> = {
  Student: 'e.g. 2024-001',
  Faculty: 'e.g. FAC-001',
  Admin: 'Enter username',
}

export default function LoginPage() {
  const [role, setRole] = useState<Role>('Student')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // connect to your backend auth here
    console.log({ role, id, password })
  }

  return (
    <div className='min-h-screen bg-[#f4f6fb] flex items-center justify-center p-6'>
      <div className='bg-white border border-gray-100 rounded-2xl p-10 w-full max-w-sm'>
        <h1 className='text-xl font-bold text-gray-900 mb-6'>School Information System</h1>
        {/* Role Toggle */}
        {/* <div className='flex gap-1 bg-[#f4f6fb] rounded-xl p-1 mb-6'>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                role === r
                  ? 'bg-white text-gray-900 border border-gray-100'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div> */}

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {/* ID Field */}
          <div>
            <label className='block text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-1.5'>
              {ROLE_LABELS[role]}
            </label>
            <input
              type='text'
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={ROLE_PLACEHOLDERS[role]}
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
              className='w-full px-3.5 py-2.5 rounded-lg border border-gray-100 bg-[#f8f9fd] text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400 focus:bg-white transition-all'
            />
          </div>

          <button
            type='submit'
            className='w-full py-2.5 rounded-lg bg-[#1a1f36] hover:bg-indigo-500 text-white text-sm font-medium transition-colors mt-1'
          >
            Sign in
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