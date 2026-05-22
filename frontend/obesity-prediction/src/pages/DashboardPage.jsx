import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Heart,
  Weight,
  Lock,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Button, InputField, SelectField, Modal } from '../components/ui';
import { getDashboard, predictObesity } from '../services/api';

const DEV_MODE = true;

const MOCK_DASHBOARD = {
  has_data: true,
  data_terbaru: {
    weight: 72,
    bmi: 26.4,
    status_kesehatan: 'Overweight',
    tanggal_tes_terakhir: '2026-03-12',
    age: 25,
    gender_num: 1,
    height: 165,
    ch2o: 2,
    family_history_num: 0,
    favc_num: 1,
    scc_num: 0,
  },
};

// 4 kategori hasil prediksi
const STATUS_STYLE = {
  Underweight: {
    badge: 'bg-blue-100 text-blue-700',
    label: 'Underweight',
  },
  Normal: { badge: 'bg-green-100 text-green-700', label: 'Normal' },
  Overweight: {
    badge: 'bg-yellow-100 text-yellow-700',
    label: 'Overweight',
  },
  Obesity: { badge: 'bg-red-100 text-red-600', label: 'Obesitas' },
};
const getStatus = (key) =>
  STATUS_STYLE[key] ?? {
    badge: 'bg-gray-100 text-gray-600',
    label: key ?? '-',
  };

const getBmiInfo = (bmi) => {
  if (!bmi) return { label: '-', pct: 0 };
  if (bmi < 18.5) return { label: 'Di bawah Ideal (< 18.5)', pct: 20 };
  if (bmi < 25)
    return { label: 'Berada di rentang Ideal (18.5 – 25.0)', pct: 55 };
  if (bmi < 30) return { label: 'Di atas Ideal (25.0 – 30.0)', pct: 75 };
  return { label: 'Obesitas (> 30)', pct: 95 };
};

const calcDaysLeft = (tanggal) => {
  if (!tanggal) return 0;
  const last = new Date(tanggal);
  const next = new Date(last.getTime() + 30 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil((next - new Date()) / (1000 * 60 * 60 * 24)));
};

const EXERCISE_OPTIONS = [
  { value: '0', label: 'Tidak Pernah' },
  { value: '1-2', label: '1–2 Hari' },
  { value: '3-4', label: '3–4 Hari' },
  { value: '4+', label: 'Lebih dari 4 Hari' },
];
const SNACKING_OPTIONS = [
  { value: 'never', label: 'Tidak Pernah' },
  { value: 'sometimes', label: 'Kadang-Kadang' },
  { value: 'frequent', label: 'Sering' },
  { value: 'always', label: 'Selalu' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Pengguna';

  const [data, setData] = useState(null);
  const [prevWeight, setPrevWeight] = useState(null); // berat sebelum update
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [progress, setProgress] = useState({
    weight: '',
    exercise_freq: '',
    snacking: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    if (DEV_MODE) {
      setTimeout(() => {
        setData(MOCK_DASHBOARD);
        setLoading(false);
      }, 500);
      return;
    }
    getDashboard()
      .then(({ data: d }) => setData(d))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSaveProgress = async () => {
    if (!progress.weight) return;
    setSaving(true);
    const newWeight = parseFloat(progress.weight);
    try {
      if (!DEV_MODE) {
        const last = data?.data_terbaru;
        await predictObesity({
          age: last?.age ?? 25,
          gender: last?.gender_num === 1 ? 'male' : 'female',
          height: (last?.height ?? 165) / 100,
          weight: progress.weight,
          water_intake: last?.ch2o ?? 2,
          snacking: progress.snacking || 'sometimes',
          family_history: last?.family_history_num === 1 ? 'yes' : 'no',
          exercise_freq: progress.exercise_freq || '1-2',
          monitor_calories: last?.scc_num === 1 ? 'yes' : 'no',
          high_calorie: last?.favc_num === 1 ? 'yes' : 'no',
        });
        const { data: fresh } = await getDashboard();
        setPrevWeight(data?.data_terbaru?.weight ?? null);
        setData(fresh);
      } else {
        setPrevWeight(data?.data_terbaru?.weight ?? null);
        setData((prev) => ({
          ...prev,
          data_terbaru: { ...prev.data_terbaru, weight: newWeight },
        }));
      }
      setModalOpen(false);
      setProgress({ weight: '', exercise_freq: '', snacking: '' });
    } catch (err) {
      console.error('Gagal update progress:', err);
    } finally {
      setSaving(false);
    }
  };

  const bmi = data?.data_terbaru?.bmi;
  const status = data?.data_terbaru?.status_kesehatan;
  const weight = data?.data_terbaru?.weight;
  const tanggal = data?.data_terbaru?.tanggal_tes_terakhir;
  const daysLeft = calcDaysLeft(tanggal);
  const canUpdate = daysLeft === 0;
  const bmiInfo = getBmiInfo(bmi);
  const statusStyle = getStatus(status);

  // Hitung selisih berat
  const weightDiff =
    prevWeight !== null && weight !== null
      ? parseFloat((weight - prevWeight).toFixed(1))
      : null;

  return (
    <DashboardLayout>
      {/* Header — nama */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Selamat Datang, {username}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Pantau perkembangan kesehatan Anda hari ini.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm animate-pulse">
          Memuat data...
        </div>
      ) : !data?.has_data ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-blue-100">
          <p className="text-gray-500 mb-4">
            Anda belum melakukan prediksi kesehatan.
          </p>
          <Button onClick={() => navigate('/input')}>
            Mulai Prediksi Sekarang
          </Button>
        </div>
      ) : (
        <>
          {/* ── 3 Stat Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {/* BMI Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <BarChart2 size={18} />
                <span className="text-sm">BMI Analysis</span>
              </div>
              <p className="text-4xl font-bold text-primary-light mb-4">
                {bmi ?? '-'}
              </p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${bmiInfo.pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{bmiInfo.label}</p>
            </div>

            {/* Status Card  */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <Heart size={18} />
                <span className="text-sm">Status Kesehatan</span>
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">
                {statusStyle.label}
              </p>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle.badge}`}
              >
                {statusStyle.label}
              </span>
            </div>

            {/* Berat Card — dengan indikator naik/turun */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <Weight size={18} />
                <span className="text-sm">Berat Badan Terakhir</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <p className="text-4xl font-bold text-gray-800">
                  {weight ?? '-'}
                </p>
                <p className="text-gray-400 mb-1 text-sm">kg</p>
              </div>
              {/* Indikator perubahan berat */}
              {weightDiff !== null && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    weightDiff < 0
                      ? 'text-green-600'
                      : weightDiff > 0
                        ? 'text-red-500'
                        : 'text-gray-400'
                  }`}
                >
                  {weightDiff < 0 ? (
                    <TrendingDown size={13} />
                  ) : weightDiff > 0 ? (
                    <TrendingUp size={13} />
                  ) : (
                    <Minus size={13} />
                  )}
                  {weightDiff === 0
                    ? 'Berat tidak berubah'
                    : weightDiff < 0
                      ? `Turun ${Math.abs(weightDiff)} kg`
                      : `Naik ${weightDiff} kg`}
                </div>
              )}
              {weightDiff === null && (
                <p className="text-xs text-gray-400">
                  Update progress untuk melihat perubahan
                </p>
              )}
            </div>
          </div>

          {/* ── Update Progress Section ── */}
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-blue-100 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Tambahkan Progress Bulanan Anda
            </h2>
            <button
              onClick={() => (canUpdate || DEV_MODE) && setModalOpen(true)}
              className={`
                inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200
                ${
                  canUpdate || DEV_MODE
                    ? 'bg-primary text-white hover:bg-[#16305e] shadow-lg shadow-blue-200 cursor-pointer'
                    : 'bg-[#2d4a7a] text-white/80 cursor-not-allowed'
                }
              `}
            >
              <Lock size={20} />
              Update Progress Bulanan
              {!canUpdate && !DEV_MODE && (
                <span className="text-sm font-normal text-blue-200">
                  (tersedia dalam {daysLeft} hari)
                </span>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Update Progress Kesehatan"
        subtitle="Masukkan data terbaru Anda untuk mendapatkan analisis AI yang akurat."
      >
        <div className="flex flex-col gap-5">
          <InputField
            label="Berat Badan Sekarang (kg)"
            id="prog_weight"
            type="number"
            placeholder="Contoh: 70"
            value={progress.weight}
            onChange={(e) =>
              setProgress((p) => ({ ...p, weight: e.target.value }))
            }
            required
          />
          <SelectField
            label="Frekuensi Olahraga"
            id="prog_exercise"
            options={EXERCISE_OPTIONS}
            value={progress.exercise_freq}
            onChange={(e) =>
              setProgress((p) => ({ ...p, exercise_freq: e.target.value }))
            }
          />
          <SelectField
            label="Perubahan Kebiasaan Ngemil"
            id="prog_snacking"
            options={SNACKING_OPTIONS}
            value={progress.snacking}
            onChange={(e) =>
              setProgress((p) => ({ ...p, snacking: e.target.value }))
            }
          />
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button fullWidth onClick={handleSaveProgress} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
