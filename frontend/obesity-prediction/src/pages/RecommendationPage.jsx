import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Dumbbell, Sparkles, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui';
import { getRecommendation } from '../services/api';

const DEV_MODE = true;

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

// ── Parse teks Gemini jadi 3 section ──────────────────────────
const parseRekomendasi = (text) => {
  if (!text) return { makan: '', olahraga: '', air: '', catatan: '' };
  const lines = text.split('\n');
  const sections = { makan: [], olahraga: [], air: [], catatan: [] };
  let current = null;
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (/^1\.|pola makan/i.test(l)) {
      current = 'makan';
      continue;
    }
    if (/^2\.|aktivitas|olahraga/i.test(l)) {
      current = 'olahraga';
      continue;
    }
    if (/^3\.|asupan air/i.test(l)) {
      current = 'air';
      continue;
    }
    if (/catatan/i.test(l)) {
      current = 'catatan';
      continue;
    }
    if (current) sections[current].push(l.replace(/^[-•*]\s*/, ''));
  }
  return {
    makan: sections.makan.join('\n'),
    olahraga: sections.olahraga.join('\n'),
    air: sections.air.join('\n'),
    catatan: sections.catatan.join(' '),
  };
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
        /* Belum ada rekomendasi — tampilkan tombol generate */
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

          <div className="flex gap-6">
            {/* ── Kolom kiri: Kebiasaan Harian ── */}
            <div className="w-56 shrink-0 bg-white rounded-2xl p-6 shadow-sm border border-blue-100 self-start">
              <h3 className="text-lg font-bold text-gray-800 mb-4 leading-snug">
                Kebiasaan Harian Sehat
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: 'Minum Air Putih (2L)',
                    sub: 'Terhidrasi sepanjang hari',
                    icon: '💧',
                  },
                  {
                    label: '10.000 Langkah',
                    sub: 'Target aktivitas harian',
                    icon: '🚶',
                  },
                  {
                    label: 'Porsi Sayur 50%',
                    sub: 'Kontrol volume makanan',
                    icon: '🥗',
                  },
                  {
                    label: 'Tidur 8 Jam',
                    sub: 'Pemulihan optimal',
                    icon: '🌙',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-[#f5f8ff] rounded-xl px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Kolom kanan: Rekomendasi AI ── */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Pola Makan */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils size={20} className="text-[#2d3a8c]" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Rekomendasi Pola Makan
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsed.makan
                    .split('\n')
                    .filter(Boolean)
                    .reduce((acc, line, i, arr) => {
                      if (i % Math.ceil(arr.length / 2) === 0) acc.push([]);
                      acc[acc.length - 1].push(line);
                      return acc;
                    }, [])
                    .map((group, gi) => (
                      <div
                        key={gi}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-3 text-lg">
                          {gi === 0 ? '🥗' : '🌿'}
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2">
                          {gi === 0
                            ? 'Defisit Kalori Terukur'
                            : 'Diet Tinggi Serat & Kalori'}
                        </h4>
                        <ul className="space-y-1">
                          {group.map((line, li) => (
                            <li
                              key={li}
                              className="text-xs text-gray-600 leading-relaxed"
                            >
                              • {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>

              {/* Olahraga */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell size={20} className="text-[#2d3a8c]" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Rekomendasi Olahraga
                  </h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 flex gap-6">
                  <div className="shrink-0 bg-[#f0f4ff] rounded-xl p-4 text-center min-w-30">
                    <p className="text-xs text-gray-500 mb-1">Target Harian</p>
                    <p className="text-3xl font-extrabold text-[#2d3a8c]">
                      10.000
                    </p>
                    <p className="text-xs font-semibold text-gray-500 tracking-widest">
                      LANGKAH
                    </p>
                  </div>
                  <ul className="flex flex-col gap-3 justify-center">
                    {parsed.olahraga
                      .split('\n')
                      .filter(Boolean)
                      .map((line, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-gray-700"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#2d3a8c] shrink-0 mt-1.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* Catatan */}
              {parsed.catatan && (
                <p className="text-xs text-gray-400 italic px-1">
                  {parsed.catatan}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
