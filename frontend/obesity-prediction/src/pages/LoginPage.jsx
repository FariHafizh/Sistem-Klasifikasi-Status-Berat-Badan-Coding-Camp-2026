import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button, PasswordInput } from '../components/ui';
import { loginUser } from '../services/api';

// ─────────────────────────────────────────────────────────────
// DEV_MODE = true, bypass backend, langsung masuk tanpa API
// DEV_MODE = false, kalo udh diintegrasi ke backend
// ─────────────────────────────────────────────────────────────
const DEV_MODE = true;

function IconInput({
  id,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`
        flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border bg-white
        transition-all duration-150 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary
        ${error ? 'border-red-400' : 'border-gray-200'}
      `}
      >
        <Icon size={16} className="text-gray-400 shrink-0" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email) {
      errs.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Format email tidak valid';
    }
    if (!form.password) errs.password = 'Password wajib diisi';
    else if (form.password.length < 6)
      errs.password = 'Password minimal 6 karakter';
    return errs;
  };

  const handleSubmit = async () => {
    // ── DEV MODE: skip validasi & API ──
    if (DEV_MODE) {
      localStorage.setItem('token', 'dev-token');
      localStorage.setItem('username', 'Developer');
      navigate('/input');
      return;
    }

    // ── PRODUCTION MODE ──
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await loginUser(form);
      // Backend response: { message, username, access_token }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', data.username);
      navigate('/input');
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Email atau password salah. Coba lagi.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 w-full max-w-md p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800">
              Selamat Datang
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Masukkan email untuk mengakses detail kesehatan
            </p>
          </div>

          {DEV_MODE && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs text-center">
              DEV MODE, klik Masuk langsung masuk tanpa validasi
            </div>
          )}
          {justRegistered && !DEV_MODE && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm text-center">
              Akun berhasil dibuat! Silakan login.
            </div>
          )}
          {apiError && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {apiError}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <IconInput
                id="email"
                icon={Mail}
                type="email"
                placeholder="name@hospital.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
              />
            </div>

            <div className="flex flex-col gap-1">
              <PasswordInput
                label="Password"
                id="password"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
              />
              <div className="flex justify-end">
                <span className="text-xs text-primary-light cursor-pointer hover:underline">
                  Lupa Password?
                </span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-gray-400">Atau</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            <p className="text-sm text-center text-gray-500">
              Tidak Punya Akun?{' '}
              <Link
                to="/register"
                className="font-bold text-gray-800 hover:text-primary transition-colors"
              >
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
