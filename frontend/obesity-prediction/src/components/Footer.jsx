import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-blue-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/favicon.webp"
                alt="ObesityPredict logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-primary text-base">
                ObesityPredict
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Pantau kesehatan tubuhmu dengan kecerdasan buatan. Gratis dan
              mudah digunakan.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                aria-label="Instagram"
                className="hover:opacity-70 transition-opacity"
              >
                <img src="/instagram.svg" alt="Instagram" className="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="hover:opacity-70 transition-opacity"
              >
                <img src="/github.svg" alt="GitHub" className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Nav Links */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Navigation
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a
                  href="#fitur"
                  className="hover:text-primary transition-colors"
                >
                  Fitur
                </a>
              </li>
              <li>
                <a
                  href="#cara-kerja"
                  className="hover:text-primary transition-colors"
                >
                  Cara Kerja
                </a>
              </li>
              <li>
                <Link
                  to="/input"
                  className="hover:text-primary transition-colors"
                >
                  Mulai Prediksi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-blue-50 text-xs text-center text-gray-400">
          © 2025 ObesityPredict. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
