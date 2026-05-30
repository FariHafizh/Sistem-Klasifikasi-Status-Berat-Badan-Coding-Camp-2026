import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Dumbbell, Sparkles, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Button, ConfirmModal } from '../components/ui';
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
  line
    .replace(/[`*_]/g, '')
    .replace(/^\s*[-•]\s*/, '')
    .replace(/^\s*\d+\.?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

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

const parseWeeklyPlan = (items) => {
  const days = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ];
  const byDay = {};
  items.forEach((line) => {
    const cleaned = cleanLine(line);
    const match = cleaned.match(
      /^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\s*[:\-]\s*(.+)$/i,
    );
    if (match) {
      const day = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
      byDay[day] = match[2].trim();
    }
  });

  if (Object.keys(byDay).length > 0) {
    return days.map((day) => ({
      day,
      activity: byDay[day] || 'Aktivitas ringan',
    }));
  }

  return buildWeeklyPlan(items);
};

const parseKeyValueLines = (lines) => {
  const data = {};
  const other = [];
  const knownLabels = [
    'metode',
    'tips',
    'target',
    'sarapan',
    'makan siang',
    'makan sore',
    'makan malam',
    'camilan',
  ];
  lines.forEach((line) => {
    const cleaned = cleanLine(line);
    const colonMatch = cleaned.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      data[colonMatch[1].trim().toLowerCase()] = colonMatch[2].trim();
      return;
    }

    const looseMatch = cleaned.match(/^([A-Za-z\s]+)[\-–—]\s*(.+)$/);
    if (looseMatch) {
      const label = looseMatch[1].trim().toLowerCase();
      if (knownLabels.includes(label)) {
        data[label] = looseMatch[2].trim();
        return;
      }
    }

    const spaceMatch = cleaned.match(/^([A-Za-z\s]+)\s+(.+)$/);
    if (spaceMatch) {
      const label = spaceMatch[1].trim().toLowerCase();
      if (knownLabels.includes(label)) {
        data[label] = spaceMatch[2].trim();
        return;
      }
    }

    if (cleaned) other.push(cleaned);
  });
  return { data, other };
};

const downloadSchedulePng = (plan) => {
  const canvas = document.createElement('canvas');
  const width = 900;
  const rowHeight = 64;
  const headerHeight = 44;
  const topPadding = 140;
  const height = topPadding + headerHeight + rowHeight * plan.length + 40;
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

  const tableX = 40;
  const tableY = topPadding;
  const tableWidth = width - tableX * 2;
  const dayColWidth = 140;
  const activityColWidth = tableWidth - dayColWidth;

  const wrapText = (text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let offsetY = 0;
    words.forEach((word, index) => {
      const testLine = `${line}${word} `;
      const { width: testWidth } = ctx.measureText(testLine);
      if (testWidth > maxWidth && index > 0) {
        ctx.fillText(line.trim(), x, y + offsetY);
        line = `${word} `;
        offsetY += lineHeight;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line.trim(), x, y + offsetY);
    return offsetY + lineHeight;
  };

  ctx.fillStyle = '#eef2ff';
  ctx.fillRect(tableX, tableY, tableWidth, headerHeight);

  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, tableY, tableWidth, headerHeight);
  ctx.beginPath();
  ctx.moveTo(tableX + dayColWidth, tableY);
  ctx.lineTo(tableX + dayColWidth, tableY + headerHeight);
  ctx.stroke();

  ctx.fillStyle = '#1f2a44';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Hari', tableX + 16, tableY + 28);
  ctx.fillText('Aktivitas', tableX + dayColWidth + 16, tableY + 28);

  let y = tableY + headerHeight;
  plan.forEach((item) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tableX, y, tableWidth, rowHeight);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(tableX, y, tableWidth, rowHeight);
    ctx.beginPath();
    ctx.moveTo(tableX + dayColWidth, y);
    ctx.lineTo(tableX + dayColWidth, y + rowHeight);
    ctx.stroke();

    ctx.fillStyle = '#1f2a44';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(item.day, tableX + 16, y + 38);

    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    wrapText(
      item.activity,
      tableX + dayColWidth + 16,
      y + 28,
      activityColWidth - 24,
      18,
    );

    y += rowHeight;
  });

  const link = document.createElement('a');
  link.download = 'jadwal-olahraga-mingguan.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export default function RecommendationPage() {
  const navigate = useNavigate();
  const cachedText = sessionStorage.getItem('rekomendasi:text');
  const cachedMeta = sessionStorage.getItem('rekomendasi:meta');
  let cachedMetaValue = null;
  try {
    cachedMetaValue = cachedMeta ? JSON.parse(cachedMeta) : null;
  } catch {
    cachedMetaValue = null;
  }
  const [rekomendasi, setRekomendasi] = useState(cachedText || null);
  const [loading, setLoading] = useState(!cachedText);
  const [generating, setGenerating] = useState(false);
  const [cached, setCached] = useState(cachedMetaValue?.cached ?? false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchRekom = useCallback(
    async ({ forceGenerate = false, silent = false } = {}) => {
      if (!forceGenerate && !silent) setLoading(true);
      if (forceGenerate) setGenerating(true);
      setError('');
      try {
        if (DEV_MODE) {
          await new Promise((r) => setTimeout(r, 800));
          setRekomendasi(MOCK_REKOMENDASI);
          setCached(false);
          return;
        }
        const { data } = await getRecommendation(!forceGenerate, forceGenerate);
        setRekomendasi(data.rekomendasi);
        setCached(data.cached ?? false);
        if (data.rekomendasi) {
          sessionStorage.setItem('rekomendasi:text', data.rekomendasi);
          sessionStorage.setItem(
            'rekomendasi:meta',
            JSON.stringify({ cached: data.cached ?? false }),
          );
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (err.response?.status === 404) {
          setError('Lakukan prediksi kesehatan terlebih dahulu.');
        } else if (err.response?.status === 503) {
          setError(
            err.response?.data?.message ||
              'Fitur rekomendasi belum dikonfigurasi.',
          );
        } else {
          setError(err.response?.data?.message || 'Gagal memuat rekomendasi.');
        }
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

      await fetchRekom({ silent: !!cachedText });
    };

    init();
  }, [cachedText, fetchRekom, navigate]);

  const parsed = parseRekomendasi(rekomendasi);
  const makanKV = parseKeyValueLines(parsed.makan);
  const olahragaKV = parseKeyValueLines(parsed.olahraga);
  const airKV = parseKeyValueLines(parsed.air);
  const olahragaPlan = parseWeeklyPlan(parsed.olahraga);
  const airTarget = airKV.data['target'] || '';
  const airNumberMatch = airTarget.match(/(\d+(?:[\.,]\d+)?)/);
  const airNumber = airNumberMatch ? airNumberMatch[1].replace(',', '.') : '-';
  const handleGenerateClick = () => {
    if (rekomendasi) {
      setShowConfirm(true);
      return;
    }
    sessionStorage.removeItem('rekomendasi:text');
    sessionStorage.removeItem('rekomendasi:meta');
    fetchRekom({ forceGenerate: true });
  };

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
          {error.toLowerCase().includes('prediksi') ? (
            <Button onClick={() => navigate('/input')}>Mulai Prediksi</Button>
          ) : (
            <Button onClick={() => fetchRekom({ forceGenerate: true })}>
              Coba Lagi
            </Button>
          )}
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
          <Button onClick={handleGenerateClick} disabled={generating}>
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Membuat...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Buat Rekomendasi
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
              onClick={handleGenerateClick}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Membuat...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Buat Rekomendasi
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
                {parsed.makan.length ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#f7f9ff] rounded-xl p-4 border border-blue-100 h-full">
                        <p className="text-sm font-semibold text-[#6b7bb5] mb-1">
                          Metode
                        </p>
                        <p className="text-[13px] text-gray-700 leading-6">
                          {makanKV.data['metode'] || 'Belum tersedia.'}
                        </p>
                      </div>
                      <div className="bg-[#f5f0ff] rounded-xl p-4 border border-[#e4d6ff] h-full">
                        <p className="text-sm font-semibold text-[#6f56d9] mb-1">
                          Tips
                        </p>
                        <p className="text-[13px] text-gray-700 leading-6">
                          {makanKV.data['tips'] || 'Belum tersedia.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        ['Sarapan', makanKV.data['sarapan']],
                        ['Makan Siang', makanKV.data['makan siang']],
                        ['Makan Sore', makanKV.data['makan sore']],
                        ['Makan Malam', makanKV.data['makan malam']],
                        ['Camilan', makanKV.data['camilan']],
                      ]
                        .filter(([, value]) => value)
                        .map(([label, value]) => (
                          <div
                            key={label}
                            className="border border-gray-100 rounded-xl p-4 h-full"
                          >
                            <p className="text-sm font-semibold text-[#6b7bb5] mb-1">
                              {label}
                            </p>
                            <p className="text-[13px] text-gray-700 leading-6">
                              {value}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Rekomendasi belum tersedia.
                  </p>
                )}
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
                {parsed.olahraga.length ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#f7f9ff] rounded-xl p-4 border border-blue-100 h-full">
                        <p className="text-sm font-semibold text-[#6b7bb5] mb-1">
                          Metode
                        </p>
                        <p className="text-[13px] text-gray-700 leading-6">
                          {olahragaKV.data['metode'] || 'Belum tersedia.'}
                        </p>
                      </div>
                      <div className="bg-[#f5f0ff] rounded-xl p-4 border border-[#e4d6ff] h-full">
                        <p className="text-sm font-semibold text-[#6f56d9] mb-1">
                          Tips
                        </p>
                        <p className="text-[13px] text-gray-700 leading-6">
                          {olahragaKV.data['tips'] || 'Belum tersedia.'}
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-100 rounded-xl p-4">
                      <p className="text-sm font-semibold text-[#6b7bb5] mb-3">
                        Jadwal Mingguan
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {olahragaPlan.map((item) => (
                          <div
                            key={item.day}
                            className="grid grid-cols-[110px_1fr] items-start gap-3"
                          >
                            <span className="text-sm font-semibold text-[#6b7bb5]">
                              {item.day}
                            </span>
                            <span className="text-[13px] text-gray-700 leading-6">
                              {item.activity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Rekomendasi belum tersedia.
                  </p>
                )}
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
                {parsed.air.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                      <img
                        src="/gelas.png"
                        alt="Ilustrasi gelas air"
                        className="w-24 md:w-28 h-auto drop-shadow-md"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-5xl md:text-6xl font-extrabold text-[#2d3a8c] leading-none">
                          {airNumber}
                        </span>
                        <span className="text-base text-gray-600">
                          Gelas per hari
                        </span>
                      </div>
                    </div>
                    <div className="md:border-l md:border-blue-50 md:pl-6">
                      <p className="text-sm font-semibold text-[#6b7bb5] mb-2">
                        Komitmen 30 Hari
                      </p>
                      <p className="text-[13px] text-gray-600 leading-6">
                        Ikuti rekomendasi di atas selama sebulan, lalu update
                        progres badan kamu untuk melihat perubahan secara
                        berkala.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Rekomendasi belum tersedia.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#fff7e8] rounded-2xl p-5 shadow-sm border border-[#fde1b2]">
              <p className="text-sm text-[#7a5a1f]">
                Catatan: Rekomendasi ini bersifat umum dan tidak menggantikan
                konsultasi dengan profesional secara langsung.
              </p>
            </div>
          </div>

          <ConfirmModal
            open={showConfirm}
            title="Buat Rekomendasi Baru?"
            message="Rekomendasi saat ini akan diganti dengan hasil terbaru dari AI. Lanjutkan?"
            cancelText="Batal"
            confirmText="Ya, Buat Baru"
            onCancel={() => setShowConfirm(false)}
            onConfirm={() => {
              setShowConfirm(false);
              sessionStorage.removeItem('rekomendasi:text');
              sessionStorage.removeItem('rekomendasi:meta');
              fetchRekom({ forceGenerate: true });
            }}
          />
        </>
      )}
    </DashboardLayout>
  );
}
