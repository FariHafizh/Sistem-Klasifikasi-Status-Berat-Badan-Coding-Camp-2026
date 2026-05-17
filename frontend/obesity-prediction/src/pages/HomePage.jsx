import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, BarChart2, Stethoscope, ShieldCheck, ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// ── Animation helpers ──────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ── Feature cards data ─────────────────────────────────────────
const features = [
  {
    icon: <Activity size={28} />,
    title: 'Prediksi Obesitas',
    desc: 'Analisis tingkat obesitas berdasarkan data kesehatan kamu secara akurat menggunakan model AI.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: <BarChart2 size={28} />,
    title: 'Analisis BMI',
    desc: 'Hitung dan pantau indeks massa tubuh kamu secara berkala untuk melihat perkembangan.',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: <Stethoscope size={28} />,
    title: 'Rekomendasi Personal',
    desc: 'Dapatkan saran kesehatan yang dipersonalisasi sesuai kondisi dan gaya hidup kamu.',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    icon: <ShieldCheck size={28} />,
    title: 'Pantau Kesehatan',
    desc: 'Lacak riwayat kesehatanmu dari waktu ke waktu dalam satu dashboard yang mudah dipahami.',
    color: 'bg-teal-100 text-teal-700',
  },
]

// ── How it works steps ─────────────────────────────────────────
const steps = [
  {
    number: '1',
    title: 'Isi Data Kesehatan',
    desc: 'Masukkan informasi seperti usia, berat badan, tinggi badan, dan kebiasaan harianmu.',
  },
  {
    number: '2',
    title: 'Analisis AI',
    desc: 'Sistem kami memproses datamu menggunakan model deep learning yang terlatih.',
  },
  {
    number: '3',
    title: 'Hasil Prediksi',
    desc: 'Dapatkan hasil prediksi tingkat obesitas beserta rekomendasi perawatan yang tepat.',
  },
]

// ── Page ───────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#eaf2fc]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 flex flex-col md:flex-row items-stretch gap-12">
        {/* Left copy */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="text-4xl md:text-5xl font-extrabold text-[#1e3a6e] leading-tight"
          >
            Pantau Kesehatan <br />
            <span className="text-[#2d5be3]">Tubuhmu</span> dengan <br />
            Kecerdasan AI.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-4 text-gray-600 text-base leading-relaxed max-w-md"
          >
            ObesityPredict membantumu memantau risiko obesitas dengan analisis
            data kesehatan berbasis AI. Mudah, cepat, dan gratis.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to="/input"
              className="inline-flex items-center gap-2 bg-[#1e3a6e] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#16305e] transition-all duration-200 shadow-lg shadow-blue-200"
            >
              Mulai Prediksi Sekarang
              <ChevronRight size={16} />
            </Link>
            <a
              href="#cara-kerja"
              className="inline-flex items-center gap-2 text-[#1e3a6e] border border-[#1e3a6e] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white transition-all duration-200"
            >
              Lihat Cara Kerja
            </a>
          </motion.div>
        </div>

        {/* Right illustration — same height as left column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex items-center justify-center"
        >
          <img
            src="/heroIllustration.png"
            alt="Ilustrasi pemantauan kesehatan"
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </motion.div>
      </section>

      {/* ── FITUR UNGGULAN ── */}
      <section id="fitur" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-[#1e3a6e]">Fitur Unggulan</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Hadirnya AI untuk membantu memantau kesehatan dan hidup yang lebih baik.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="bg-[#eaf2fc] rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#1e3a6e] text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section id="cara-kerja" className="py-20 bg-[#eaf2fc]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold text-[#1e3a6e]">Bagaimana Ini Bekerja</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full bg-[#1e3a6e] text-white flex items-center justify-center text-xl font-bold mb-5 shadow-lg shadow-blue-200">
                  {step.number}
                </div>
                {/* Connector line (hidden on last) */}
                <h3 className="font-bold text-[#1e3a6e] text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-[#1e3a6e]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-white leading-tight"
          >
            Mulai Perjalanan Hidup Sehat <br />
            Anda Sekarang
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={1}
            className="mt-4 text-blue-200 text-sm leading-relaxed"
          >
            Bergabunglah dengan pengguna yang telah menggunakan ObesityPredict untuk
            memantau dan meningkatkan kesehatan mereka setiap hari.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={2}
            className="mt-8"
          >
            <Link
              to="/input"
              className="inline-flex items-center gap-2 bg-white text-[#1e3a6e] px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all duration-200 shadow-lg"
            >
              Mulai Prediksi Sekarang
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
