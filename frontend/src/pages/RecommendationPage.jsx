import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Dumbbell, Sparkles, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui';
import { getRecommendation } from '../services/api';

const DEV_MODE = false;

const MOCK_REKOMENDASI = `1. Pola Makan Harian yang Disarankan
- Sarapan: Oatmeal + buah + telur rebus
- Makan siang: Nasi merah 1 centong + ayam panggang + sayur bayam + tempe
- Makan malam: Nasi merah setengah porsi + ikan kukus + tumis kangkung
- Camilan: Buah potong atau kacang tanpa garam (maks 2x/hari)
- Hindari makanan berminyak, manis berlebih, dan minuman bersoda
- Prioritaskan protein rendah lemak dan sayuran hijau (50% piring)

2. Aktivitas Fisik/Olahraga
- Mulai dengan jalan kaki 30 menit/hari, 5x seminggu
- Tambahkan latihan beban ringan 2x seminggu (squat, push-up, plank)
- Mixed cardio: bersepeda santai atau renang 2x seminggu, 30-45 menit
- Target: 10.000 langkah per hari

3. Anjuran Asupan Air
- Minum minimal 2-2.5 liter air putih per hari
- Minum 1 gelas air sebelum makan untuk mengurangi porsi
- Hindari minuman manis; ganti dengan air putih atau teh tanpa gula

Catatan: Rekomendasi ini bersifat umum dan tidak menggantikan konsultasi dengan profesional kesehatan secara langsung.`;

const cleanLine = (line) =>
  line.replace(/\*\*/g, '').replace(/^[-•*]\s*/, '').trim();

// Parse teks Gemini jadi 3 section
const parseRekomendasi = (text) => {
  if (!text) return { makan: [], olahraga: [], air: [] };
  const lines = text.split('\n');
  const sections = { makan: [], olahraga: [], air: [] };
  let current = null;
  for (const line of lines) {
    const raw = line.trim();
    if (!raw) continue;
    if (/^1\.|pola makan/i.test(raw)) {
      current = 'makan';
      continue;
    }
    if (/^2\.|aktivitas|olahraga/i.test(raw)) {
      current = 'olahraga';
      continue;
    }
    if (/^3\.|asupan air/i.test(raw)) {
      current = 'air';
      continue;
    }
    if (!current) continue;
    const cleaned = cleanLine(raw);
    if (cleaned) sections[current].push(cleaned);
  }
  return sections;
};

const buildWeeklyPlan = (items) => {
  const days = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ];
  const list = items.length ? items : ['Aktivitas ringan'];
  return days.map((day, idx) => ({
    day,
    activity: list[idx % list.length],
  }));
};

const downloadSchedulePng = (plan) => {
  const canvas = document.createElement('canvas');
  const width = 900;
  const height = 700;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#1f2a44';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Jadwal Olahraga Mingguan', 40, 60);

  ctx.fillStyle = '#4b5563';
  ctx.font = '16px sans-serif';
  ctx.fillText('Berdasarkan rekomendasi AI', 40, 90);

  let y = 140;
  plan.forEach((item) => {
    ctx.fillStyle = '#1f2a44';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(item.day, 40, y);

    ctx.fillStyle = '#374151';
    ctx.font = '16px sans-serif';
    ctx.fillText(item.activity, 180, y);
    y += 50;
  });

  const link = document.createElement('a');
  link.download = 'jadwal-olahraga-mingguan.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export default function RecommendationPage() {
  const navigate = useNavigate();
  const [rekomendasi, setRekomendasi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');

  const fetchRekom = useCallback(
    async (forceGenerate = false) => {
      if (!forceGenerate) setLoading(true);
      else setGenerating(true);
      setError('');
      try {
        if (DEV_MODE) {
          await new Promise((r) => setTimeout(r, 800));
          setRekomendasi(MOCK_REKOMENDASI);
          setCached(false);
          return;
        }
        const { data } = await getRecommendation(forceGenerate ? false : true);
        setRekomendasi(data.rekomendasi);
        setCached(data.cached ?? false);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (err.response?.status === 404)
          setError('Lakukan prediksi kesehatan terlebih dahulu.');
        else if (err.response?.status === 503)
          setError('Fitur rekomendasi belum dikonfigurasi.');
        else setError('Gagal memuat rekomendasi.');
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    },
    [navigate],
  );

  useEffect(() => {
    const init = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/login');
        return;
      }

      await fetchRekom();
    };

    init();
  }, [fetchRekom, navigate]);

  const parsed = parseRekomendasi(rekomendasi);
  const olahragaPlan = buildWeeklyPlan(parsed.olahraga);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#2d3a8c]">
          Rekomendasi Personal
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Strategi kesehatan yang dioptimalkan oleh AI khusus untuk profil Anda.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm animate-pulse">
          Memuat rekomendasi...
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-blue-100">
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/input')}>Mulai Prediksi</Button>
        </div>
      ) : !rekomendasi ? (
        /* Belum ada rekomendasi, tampilin tombol generate */
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-blue-100">
          <Sparkles size={40} className="mx-auto text-[#2d3a8c] mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Belum Ada Rekomendasi
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Klik tombol di bawah untuk membuat rekomendasi kesehatan personal
            berbasis AI.
          </p>
          <Button onClick={() => fetchRekom(true)} disabled={generating}>
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Membuat...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Rekomendasi
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Tombol re-generate */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRekom(true)}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Membuat...
                </>
              ) : (
                <>
                  <Sparkles size={14} />{' '}
                  {cached ? 'Buat Rekomendasi Baru' : 'Generate Ulang'}
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {/* Pola Makan */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Utensils size={20} className="text-[#2d3a8c]" />
                <h3 className="text-lg font-bold text-gray-800">
                  Pola Makan Harian
                </h3>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                <ul className="space-y-2">
                  {parsed.makan.length ? (
                    parsed.makan.map((line, i) => (
                      <li key={i} className="text-sm text-gray-700 leading-7">
                        • {line}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-400">
                      Rekomendasi belum tersedia.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Olahraga */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Dumbbell size={20} className="text-[#2d3a8c]" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Olahraga per Minggu
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!parsed.olahraga.length}
                  onClick={() => downloadSchedulePng(olahragaPlan)}
                >
                  Download Jadwal
                </Button>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                <ul className="space-y-2">
                  {parsed.olahraga.length ? (
                    parsed.olahraga.map((line, i) => (
                      <li key={i} className="text-sm text-gray-700 leading-7">
                        • {line}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-400">
                      Rekomendasi belum tersedia.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Asupan Air */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={20} className="text-[#2d3a8c]" />
                <h3 className="text-lg font-bold text-gray-800">
                  Asupan Air Putih Harian
                </h3>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                <ul className="space-y-2">
                  {parsed.air.length ? (
                    parsed.air.map((line, i) => (
                      <li key={i} className="text-sm text-gray-700 leading-7">
                        • {line}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-400">
                      Rekomendasi belum tersedia.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
