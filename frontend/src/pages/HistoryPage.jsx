import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import { getHistory } from '../services/api';

const DEV_MODE = false; // Set true untuk menggunakan data mock

const MOCK_HISTORY = [
  {
    id: 1,
    tanggal: '2026-03-12 10:45:00',
    bmi: 26.4,
    status_kesehatan: 'Overweight',
    weight: 72,
  },
  {
    id: 2,
    tanggal: '2026-02-28 14:20:00',
    bmi: 22.1,
    status_kesehatan: 'Normal',
    weight: 68,
  },
  {
    id: 3,
    tanggal: '2026-01-15 09:15:00',
    bmi: 17.8,
    status_kesehatan: 'Underweight',
    weight: 50,
  },
  {
    id: 4,
    tanggal: '2025-12-02 16:40:00',
    bmi: 31.2,
    status_kesehatan: 'Obesity',
    weight: 89,
  },
];

const STATUS_BADGE = {
  Normal: 'bg-green-100 text-green-700',
  Underweight: 'bg-blue-100 text-blue-700',
  Overweight: 'bg-yellow-100 text-yellow-700',
  Obesity: 'bg-red-100 text-red-600',
};
const STATUS_LABEL = {
  Normal: 'Normal',
  Underweight: 'Underweight',
  Overweight: 'Overweight',
  Obesity: 'Obesity',
};

// Format tanggal dari backend "YYYY-MM-DD HH:mm:ss"
const formatDate = (str) => {
  const d = new Date(str.replace(' ', 'T'));
  return {
    tanggal: d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    waktu:
      d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB',
    bulan: d.toLocaleDateString('id-ID', { month: 'short' }),
  };
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    if (DEV_MODE) {
      setTimeout(() => {
        setHistory(MOCK_HISTORY);
        setLoading(false);
      }, 500);
      return;
    }
    getHistory()
      .then(({ data }) => setHistory(data.data ?? []))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Data chart: urutan dari terlama ke terbaru
  const chartData = [...history].reverse().map((h) => ({
    name: `${formatDate(h.tanggal).bulan} ${new Date(h.tanggal.replace(' ', 'T')).getFullYear()}`,
    bmi: h.bmi,
    berat: h.weight,
  }));

  // Filter tabel berdasarkan search
  const filtered = history.filter((h) => {
    const q = search.toLowerCase();
    const label = (
      STATUS_LABEL[h.status_kesehatan] ?? h.status_kesehatan
    ).toLowerCase();
    return (
      label.includes(q) || String(h.bmi).includes(q) || h.tanggal.includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#2d3a8c]">
          Riwayat Kesehatan
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Pantau progres dan data historis kesehatan Anda di satu tempat.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm animate-pulse">
          Memuat riwayat...
        </div>
      ) : (
        <>
          {/* ── Line Chart ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 mb-6">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">
                  Progres Berat Badan
                </h2>
                <p className="text-xs text-gray-400">
                  Visualisasi perubahan metrik kesehatan selama 6 bulan
                  terakhir.
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                Berat (kg)
              </span>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v} kg`, 'Berat Badan']}
                />
                <Line
                  type="monotone"
                  dataKey="berat"
                  stroke="#3d4fcc"
                  strokeWidth={2.5}
                  dot={{ fill: '#3d4fcc', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Tabel ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800 text-lg">Data Historis</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Search size={14} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari data..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400 w-36"
                  />
                </div>
                <button className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {search
                  ? 'Tidak ada data yang cocok.'
                  : 'Belum ada riwayat prediksi.'}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pl-4">
                      Tanggal
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">
                      Skor BMI
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => {
                    const fmt = formatDate(h.tanggal);
                    const badge =
                      STATUS_BADGE[h.status_kesehatan] ??
                      'bg-gray-100 text-gray-600';
                    const label =
                      STATUS_LABEL[h.status_kesehatan] ?? h.status_kesehatan;
                    return (
                      <tr
                        key={h.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 pl-4">
                          <p className="text-sm font-medium text-gray-800">
                            {fmt.tanggal}
                          </p>
                          <p className="text-xs text-gray-400">{fmt.waktu}</p>
                        </td>
                        <td className="py-4">
                          <span className="text-base font-bold text-primary-light">
                            {Number(h.bmi).toFixed(3)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${badge}`}
                          >
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
