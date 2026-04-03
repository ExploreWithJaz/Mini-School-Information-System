export const API_URL = process.env.NEXT_PUBLIC_API_URL

interface FetchOptions extends RequestInit {
  token?: string
}

export async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
) {
  const { token, ...rest } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...rest.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
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