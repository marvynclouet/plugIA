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
  const response = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  })
  localStorage.setItem('token', response.data.access_token)
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

