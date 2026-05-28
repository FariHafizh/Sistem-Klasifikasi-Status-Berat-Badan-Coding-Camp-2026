import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ── Animation helpers ──────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Feature cards data ─────────────────────────────────────────

// ── How it works steps ─────────────────────────────────────────

// ── Page ───────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-light">
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
            className="text-4xl md:text-5xl font-extrabold text-primary leading-tight"
          >
            Pantau Kesehatan <br />
            <span className="text-primary-light">Tubuhmu</span> dengan <br />
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

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-3 text-sm font-semibold text-primary"
          >
            Sistem Prediksi Berat Badan dan Rekomendasi Action Plan
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-8 flex flex-wrap gap-3"
          >
            {/* Tombol :  */}
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-primary border border-primary px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white transition-all duration-200"
            >
              Daftar Sekarang
            </Link>
          </motion.div>
        </div>

        {/* Right illustration */}
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

      {/* ── CARA KERJA ── */}

      {/* ── CTA BANNER ── */}

      <Footer />
    </div>
  );
}
