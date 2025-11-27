import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger automatiquement pour /auth/me (géré par le layout)
    // et ne pas rediriger si on est déjà sur /login
    if (error.response?.status === 401) {
      const isAuthMe = error.config?.url?.includes('/auth/me')
      const isLoginPage = window.location.pathname === '/login'
      
      if (!isAuthMe && !isLoginPage) {
        console.log('⚠️ 401 Unauthorized, removing token and redirecting')
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        console.log('⚠️ 401 on /auth/me or already on login page, not redirecting')
      }
    }
    return Promise.reject(error)
  },
)

export default api

