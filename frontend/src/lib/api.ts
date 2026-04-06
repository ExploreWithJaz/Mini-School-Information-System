export const API_URL = process.env.NEXT_PUBLIC_API_URL

interface FetchOptions extends RequestInit {
  token?: string
}

export async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
) {
  const { token, ...rest } = options

  const headers = new Headers(rest.headers)

  const hasBody = rest.body !== undefined && rest.body !== null
  if (hasBody && !(rest.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Get token from options or localStorage
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null)
  
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}