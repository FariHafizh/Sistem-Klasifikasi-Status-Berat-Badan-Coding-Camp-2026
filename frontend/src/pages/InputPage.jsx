import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button, InputField, SelectField, RadioGroup } from '../components/ui';
import { predictObesity, getDashboard } from '../services/api';

// ─────────────────────────────────────────────────────────────
// DEV_MODE = true  → bypass API, langsung ke dashboard
// DEV_MODE = false → hit backend
// ─────────────────────────────────────────────────────────────
const DEV_MODE = false;

// ── Options ────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'male', label: 'Laki-Laki' },
  { value: 'female', label: 'Perempuan' },
];

const SNACKING_OPTIONS = [
  { value: 'never', label: 'Tidak Pernah' },
  { value: 'sometimes', label: 'Kadang-Kadang' },
  { value: 'frequent', label: 'Sering' },
  { value: 'always', label: 'Selalu' },
];

const EXERCISE_OPTIONS = [
  { value: '0', label: 'Tidak Pernah' },
  { value: '1-2', label: '1-2 Hari' },
  { value: '3-4', label: '3-4 Hari' },
  { value: '4+', label: 'Lebih dari 4 Hari' },
];

const WATER_OPTIONS = [
  { value: '1', label: 'Kurang dari 1 liter' },
  { value: '2', label: '1-2 liter' },
  { value: '3', label: 'Lebih dari 2 liter' },
];

const YES_NO = [
  { value: 'yes', label: 'Ya' },
  { value: 'no', label: 'Tidak' },
];

// ── Initial form state ─────────────────────────────────────────
const INITIAL = {
  age: '',
  gender: '',
  height: '',
  weight: '',
  water_intake: '',
  snacking: '',
  family_history: '',
  exercise_freq: '',
  monitor_calories: '',
  high_calorie: '',
};

export default function InputPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Kalau dipanggil dari Dashboard tombol Update Progress, ada state isProgress: true
  const isProgress = location.state?.isProgress === true;

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Redirect ke login kalau belum punya token (skip di DEV_MODE)
  useEffect(() => {
    if (!DEV_MODE && !localStorage.getItem('token')) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const checkExisting = async () => {
      if (DEV_MODE || isProgress) return;
      try {
        const { data } = await getDashboard();
        if (data?.has_data) navigate('/dashboard');
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    if (localStorage.getItem('token')) {
      checkExisting();
    }
  }, [DEV_MODE, isProgress, navigate]);

  // ── Handlers ────────────────────────────────────────────────
  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const setRadio = (field) => (val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    // Usia
    if (!form.age) {
      errs.age = 'Usia wajib diisi';
    } else if (isNaN(form.age) || !Number.isInteger(Number(form.age))) {
      errs.age = 'input yang anda masukkan tidak valid';
    } else if (Number(form.age) < 12 || Number(form.age) > 100) {
      errs.age = 'input yang anda masukkan tidak valid';
    }

    // Jenis Kelamin
    if (!form.gender) errs.gender = 'Jenis kelamin wajib dipilih';

    // Tinggi Badan
    if (!form.height) {
      errs.height = 'Tinggi badan wajib diisi';
    } else if (isNaN(form.height)) {
      errs.height = 'input yang anda masukkan tidak valid';
    } else if (Number(form.height) < 50 || Number(form.height) > 250) {
      errs.height = 'input yang anda masukkan tidak valid';
    }

    // Berat Badan
    if (!form.weight) {
      errs.weight = 'Berat badan wajib diisi';
    } else if (isNaN(form.weight)) {
      errs.weight = 'input yang anda masukkan tidak valid';
    } else if (Number(form.weight) < 10 || Number(form.weight) > 350) {
      errs.weight = 'input yang anda masukkan tidak valid';
    }

    // Asupan Air
    if (!form.water_intake) {
      errs.water_intake = 'Asupan air wajib diisi';
    } else if (!['1', '2', '3'].includes(String(form.water_intake))) {
      errs.water_intake = 'input yang anda masukkan tidak valid';
    }

    // Dropdown & Radio
    if (!form.snacking) errs.snacking = 'Pilih frekuensi ngemil';
    if (!form.family_history) errs.family_history = 'Pilih salah satu';
    if (!form.exercise_freq) errs.exercise_freq = 'Pilih frekuensi olahraga';
    if (!form.monitor_calories) errs.monitor_calories = 'Pilih salah satu';
    if (!form.high_calorie) errs.high_calorie = 'Pilih salah satu';

    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstErrField = Object.keys(errs)[0];
      document
        .getElementById(firstErrField)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    // DEV MODE: skip API, langsung ke dashboard
    if (DEV_MODE) {
      await new Promise((r) => setTimeout(r, 800)); // simulasi loading
      navigate('/dashboard');
      return;
    }

    // PRODUCTION MODE
    try {
      const replaceLatest = location.state?.replaceLatest === true;
      await predictObesity(form, { replaceLatest });
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-primary">
              {isProgress
                ? 'Update Progress Kesehatan'
                : 'Prediksi Tingkat Obesitas'}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {isProgress ? (
                'Masukkan data kesehatan terbaru Anda untuk memantau perkembangan kondisi.'
              ) : (
                <>
                  Masukkan data kesehatan Anda untuk mendapatkan
                  <br />
                  analisis tingkat obesitas
                </>
              )}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Usia */}
              <InputField
                label="Usia"
                id="age"
                type="number"
                placeholder="Contoh: 25"
                value={form.age}
                onChange={set('age')}
                required
                error={errors.age}
              />

              {/* Jenis Kelamin */}
              <SelectField
                label="Jenis Kelamin"
                id="gender"
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={set('gender')}
                required
                error={errors.gender}
              />

              {/* Tinggi Badan */}
              <InputField
                label="Tinggi Badan (cm)"
                id="height"
                type="number"
                placeholder="Contoh: 167"
                value={form.height}
                onChange={set('height')}
                required
                error={errors.height}
              />

              {/* Berat Badan */}
              <InputField
                label="Berat Badan (kg)"
                id="weight"
                type="number"
                placeholder="Contoh: 65"
                value={form.weight}
                onChange={set('weight')}
                required
                error={errors.weight}
              />

              {/* Asupan Air */}
              <SelectField
                label="Asupan Air Putih (Liter/Hari)"
                id="water_intake"
                options={WATER_OPTIONS}
                value={form.water_intake}
                onChange={set('water_intake')}
                required
                error={errors.water_intake}
              />

              {/* Seberapa Sering Ngemil */}
              <SelectField
                label="Seberapa Sering Ngemil"
                id="snacking"
                options={SNACKING_OPTIONS}
                value={form.snacking}
                onChange={set('snacking')}
                required
                error={errors.snacking}
              />

              {/* Divider label */}
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Kebiasaan &amp; Riwayat
                </p>
                <hr className="border-blue-100" />
              </div>

              {/* Riwayat Obesitas Keluarga */}
              <RadioGroup
                label="Riwayat Obesitas Keluarga?"
                name="family_history"
                options={YES_NO}
                value={form.family_history}
                onChange={setRadio('family_history')}
                required
                error={errors.family_history}
              />

              {/* Olahraga per Minggu */}
              <SelectField
                label="Olahraga per Minggu"
                id="exercise_freq"
                options={EXERCISE_OPTIONS}
                value={form.exercise_freq}
                onChange={set('exercise_freq')}
                required
                error={errors.exercise_freq}
              />

              {/* Memantau Asupan Kalori */}
              <RadioGroup
                label="Memantau Asupan Kalori"
                name="monitor_calories"
                options={YES_NO}
                value={form.monitor_calories}
                onChange={setRadio('monitor_calories')}
                required
                error={errors.monitor_calories}
              />

              {/* Sering Makan Tinggi Kalori */}
              <RadioGroup
                label="Sering Makan Tinggi Kalori"
                name="high_calorie"
                options={YES_NO}
                value={form.high_calorie}
                onChange={setRadio('high_calorie')}
                required
                error={errors.high_calorie}
              />
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
              Note: Prediksi ini digunakan sebagai informasi awal untuk membantu
              memantau kondisi kesehatan dan bukan pengganti konsultasi medis
              profesional.
            </p>

            {/* Submit */}
            <div className="mt-5">
              <Button
                fullWidth
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                <Sparkles size={16} />
                {loading
                  ? isProgress
                    ? 'Menyimpan...'
                    : 'Menganalisis...'
                  : isProgress
                    ? 'Simpan Update Progress'
                    : 'Generate Hasil Prediksi'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
