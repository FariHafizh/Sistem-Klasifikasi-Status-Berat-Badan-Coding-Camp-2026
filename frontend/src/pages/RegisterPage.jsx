import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button, PasswordInput } from '../components/ui';
import { registerUser } from '../services/api';

// ─────────────────────────────────────────────────────────────
// DEV_MODE = true. bypass backend, langsung ke /login
// DEV_MODE = false. kalo udh integrasi ke backend
// ─────────────────────────────────────────────────────────────
const DEV_MODE = false;

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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    if (!form.name.trim()) errs.name = 'Nama wajib diisi';
    else if (form.name.trim().length < 2) errs.name = 'Nama minimal 2 karakter';
    if (!form.email) errs.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Format email tidak valid';
    if (!form.password) errs.password = 'Password wajib diisi';
    else if (form.password.length < 6)
      errs.password = 'Password minimal 6 karakter';
    return errs;
  };

  const handleSubmit = async () => {
    // DEV MODE: skip validasi & API
    if (DEV_MODE) {
      navigate('/login', { state: { registered: true } });
      return;
    }

    // PRODUCTION MODE
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      // Backend response: { message } — tidak ada token, redirect ke login
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Registrasi gagal. Coba lagi.',
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
            <h1 className="text-3xl font-extrabold text-gray-800">Buat Akun</h1>
            <p className="text-gray-500 text-sm mt-2">
              Bergabung dengan pengguna lainnya.
            </p>
          </div>

          {DEV_MODE && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs text-center">
              DEV MODE aktif, klik Daftar langsung ke halaman login
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
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Nama
              </label>
              <IconInput
                id="name"
                icon={User}
                placeholder="Enter your name"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
              />
            </div>
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
                placeholder="name@company.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
              />
            </div>
            <PasswordInput
              label="Password"
              id="password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </Button>
            <hr className="border-gray-200" />
            <p className="text-sm text-center text-gray-500">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="font-bold text-gray-800 hover:text-primary transition-colors"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
