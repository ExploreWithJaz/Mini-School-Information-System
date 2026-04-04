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
    ...rest.headers,
  }

  const hasBody = rest.body !== undefined && rest.body !== null
  if (hasBody && !(rest.body instanceof FormData) && !(headers as Record<string, string>)['Content-Type']) {
    ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
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