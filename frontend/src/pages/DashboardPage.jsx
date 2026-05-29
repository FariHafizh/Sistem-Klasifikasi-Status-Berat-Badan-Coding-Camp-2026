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
import { Button } from '../components/ui';
import { getDashboard } from '../services/api';

const DEV_MODE = false; // Set true untuk menggunakan data mock

const MOCK_DASHBOARD = {
  has_data: true,
  data_terbaru: {
    weight: 72,
    bmi: 26.4,
    status_kesehatan: 'Overweight_Level_I',
    confidence_score: 0.91,
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
  Insufficient_Weight: {
    badge: 'bg-blue-100 text-blue-700',
    label: 'Underweight',
  },
  Normal_Weight: { badge: 'bg-green-100 text-green-700', label: 'Normal' },
  Overweight_Level_I: {
    badge: 'bg-yellow-100 text-yellow-700',
    label: 'Overweight',
  },
  Overweight_Level_II: {
    badge: 'bg-yellow-100 text-yellow-700',
    label: 'Overweight',
  },
  Obesity_Type_I: { badge: 'bg-red-100 text-red-600', label: 'Obesitas' },
  Obesity_Type_II: { badge: 'bg-red-100 text-red-600', label: 'Obesitas' },
  Obesity_Type_III: { badge: 'bg-red-100 text-red-600', label: 'Obesitas' },
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

const isSameMonth = (tanggal) => {
  if (!tanggal) return false;
  const last = new Date(tanggal);
  const now = new Date();
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth()
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Pengguna';

  const [data, setData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [prevWeight, setPrevWeight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const bmi = data?.data_terbaru?.bmi;
  const status = data?.data_terbaru?.status_kesehatan;
  const weight = data?.data_terbaru?.weight;
  const tanggal = data?.data_terbaru?.tanggal_tes_terakhir;
  const sameMonth = isSameMonth(tanggal);
  const bmiInfo = getBmiInfo(bmi);
  const statusStyle = getStatus(status);

  // Hitung selisih berat
  const weightDiff =
    prevWeight !== null && weight !== null
      ? parseFloat((weight - prevWeight).toFixed(1))
      : null;

  return (
    <DashboardLayout>
      {/* Header — nama dari localStorage */}
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

              <p className="text-sm text-gray-500 mt-3">
                Confidence Score:{' '}
                <span className="font-semibold text-gray-700">
                  {data?.data_terbaru?.confidence_score
                    ? `${(data.data_terbaru.confidence_score * 100).toFixed(1)}%`
                    : '-'}
                </span>
              </p>
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
                <p className="text-sm text-gray-400">
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
              onClick={() => {
                if (DEV_MODE) {
                  navigate('/input', { state: { isProgress: true } });
                  return;
                }
                if (sameMonth) {
                  setShowConfirm(true);
                } else {
                  navigate('/input', { state: { isProgress: true } });
                }
              }}
              className={`
                inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200
                bg-primary text-white hover:bg-[#16305e] shadow-lg shadow-blue-200
              `}
            >
              <Lock size={20} />
              Update Progress Bulanan
            </button>
          </div>

          {showConfirm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-blue-100">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Update Progress Bulan Ini?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Data progress di bulan ini akan diganti dengan input terbaru.
                  Lanjutkan?
                </p>
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => {
                      setShowConfirm(false);
                      navigate('/input', {
                        state: { isProgress: true, replaceLatest: true },
                      });
                    }}
                  >
                    Ya, Update
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
