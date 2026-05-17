import axios from 'axios'

// Ganti BASE_URL sesuai endpoint backend dari tim Backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: otomatis sisipkan token JWT kalau ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── API calls ──────────────────────────────────────────────────

/**
 * Kirim data kesehatan user ke model AI untuk prediksi
 * @param {Object} data - { age, weight, height, water_intake, snacking, exercise_freq, family_history, high_calorie, monitor_calories }
 */
export const predictObesity = (data) => api.post('/predict', data)

/**
 * Login user
 * @param {Object} credentials - { email, password }
 */
export const loginUser = (credentials) => api.post('/auth/login', credentials)

/**
 * Register user baru
 * @param {Object} payload - { name, email, password }
 */
export const registerUser = (payload) => api.post('/auth/register', payload)

/**
 * Ambil riwayat prediksi user yang sedang login
 */
export const getHistory = () => api.get('/history')

/**
 * Ambil rekomendasi berdasarkan hasil prediksi terakhir
 */
export const getRecommendation = () => api.get('/recommendation')

export default api
