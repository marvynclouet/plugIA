import { api } from './api'

export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  console.log('📡 Sending login request to:', api.defaults.baseURL + '/auth/login')
  const response = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  })
  
  console.log('📥 Login response received:', { 
    status: response.status, 
    hasToken: !!response.data?.access_token
  })
  
  if (!response.data?.access_token) {
    console.error('❌ No access_token in response')
    throw new Error('No access token received from server')
  }
  
  // Stocker le token immédiatement
  localStorage.setItem('token', response.data.access_token)
  console.log('✅ Token stored')
  
  return response.data
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', {
    email,
    password,
    name,
  })
  localStorage.setItem('token', response.data.access_token)
  return response.data
}

export function logout() {
  localStorage.removeItem('token')
  window.location.href = '/login'
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

/**
 * Vérifie si le token est valide en appelant l'endpoint /auth/me
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const token = getToken()
    if (!token) {
      return false
    }

    const response = await api.post('/auth/me')
    return response.status === 200 && !!response.data
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      return false
    }
    return false
  }
}

