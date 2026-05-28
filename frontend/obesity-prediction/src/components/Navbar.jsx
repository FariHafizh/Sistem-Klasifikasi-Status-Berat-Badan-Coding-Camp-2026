import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="w-full bg-white sticky top-0 z-50 border-b border-blue-100">
      <div className="w-full px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/favicon.webp"
            alt="ObesityPredict logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-primary text-base tracking-tight">
            ObesityPredict
          </span>
        </Link>

        {/* Nav Links + Login */}
        <div className="flex items-center gap-9">
          <Link
            to="/"
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#16305e] transition-all duration-200"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
