import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// sisipin JWT token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth

export const registerUser = ({ name, email, password }) =>
  api.post('/register', { username: name, email, password });
// Response: { message }

export const loginUser = ({ email, password }) =>
  api.post('/login', { email, password });
// Response: { message, username, access_token }

/**
 * ─────────────────────────────────────────────────────────────
 * gender:         'male'/'female'       gender_num:         1/0
 * snacking:       'never'/..'always'     caec_num:           0/1/2/3
 * family_history: 'yes'/'no'            family_history_num: 1/0
 * exercise_freq:  '0'/'1-2'/'3-4'/'4+'  faf:                0/1/2/3
 * monitor_calories:'yes'/'no'           scc_num:            1/0
 * high_calorie:   'yes'/'no'            favc_num:           1/0
 * water_intake    (langsung)             ch2o:               float
 * height          (dalam cm)         height: cm (backend konversi sendiri ke m)
 */
const SNACKING_MAP = { never: 0, sometimes: 1, frequent: 2, always: 3 };
const EXERCISE_MAP = { 0: 0, '1-2': 1, '3-4': 2, '4+': 3 };

export const predictObesity = (
  form,
  { replaceLatest = false, useLatestProfile = false } = {},
) => {
  const payload = {
    height: parseFloat(form.height), // kirim dalam cm
    weight: parseFloat(form.weight),
    ch2o: parseFloat(form.water_intake),
    favc_num: form.high_calorie === 'yes' ? 1 : 0,
    faf: EXERCISE_MAP[form.exercise_freq] ?? 0,
    scc_num: form.monitor_calories === 'yes' ? 1 : 0,
    family_history_num: form.family_history === 'yes' ? 1 : 0,
    caec_num: SNACKING_MAP[form.snacking] ?? 0,
    replace_latest: replaceLatest,
    use_latest_profile: useLatestProfile,
  };

  if (form.age !== '' && form.age !== null && form.age !== undefined) {
    payload.age = parseInt(form.age);
  }

  if (form.gender) {
    payload.gender_num = form.gender === 'male' ? 1 : 0;
  }

  return api.post('/predict', payload);
  // Response: { message, hasil_prediksi: { status_kesehatan, bmi, model_used, probabilities } }
};

// ── History ────────────────────────────────────────────────────

export const getHistory = () => api.get('/history');
// Response: { message, data: [...] }

// ── Dashboard ──────────────────────────────────────────────────

export const getDashboard = () => api.get('/dashboard');
// Response: { message, has_data, data_terbaru: { weight, bmi, status_kesehatan, tanggal_tes_terakhir } }

// ── Recommendation ─────────────────────────────────────────────

export const getRecommendation = (cacheOnly = false, forceGenerate = false) =>
  api.get('/recommendation', {
    params: {
      cache_only: cacheOnly ? '1' : '0',
      force_generate: forceGenerate ? '1' : '0',
    },
  });
// Response: { message, rekomendasi, has_data, cached }

export default api;
