import { createClient } from '@/lib/supabase/client'

/**
 * Make an authenticated API request using Supabase session
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const supabase = createClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No active session')
  }

  // Create headers with authorization
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${session.access_token}`)
  
  // Merge with existing options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  }

  return fetch(url, fetchOptions)
}

/**
 * Make an authenticated API request with automatic retry on 401
 */
export async function authenticatedApiCall(url: string, options: RequestInit = {}) {
  try {
    const response = await authenticatedFetch(url, options)
    
    // If we get a 401, try to refresh the session and retry
    if (response.status === 401) {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error || !session) {
        throw new Error('Session refresh failed')
      }
      
      // Retry the request with the new session
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${session.access_token}`)
      
      const retryOptions: RequestInit = {
        ...options,
        headers,
        credentials: 'include'
      }
      
      return fetch(url, retryOptions)
    }
    
    return response
  } catch (error) {
    console.error('Authenticated API call failed:', error)
    throw error
  }
}
