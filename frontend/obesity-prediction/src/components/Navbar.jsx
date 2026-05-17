import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
  ]

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-blue-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a6e] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="7" r="3.5" fill="white" />
              <path d="M2 16c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-[#1e3a6e] text-base tracking-tight">
            ObesityPredict
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.href.startsWith('#') ? (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-600 hover:text-[#1e3a6e] font-medium transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-gray-600 hover:text-[#1e3a6e] font-medium transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-[#1e3a6e] px-4 py-2 rounded-lg border border-[#1e3a6e] hover:bg-[#1e3a6e] hover:text-white transition-all duration-200"
          >
            Login
          </Link>
        </div>

        {/* Mobile Burger */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-blue-100 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) =>
            link.href.startsWith('#') ? (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-[#1e3a6e]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-gray-600 hover:text-[#1e3a6e]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            to="/login"
            className="text-sm font-semibold text-white bg-[#1e3a6e] px-4 py-2 rounded-lg text-center"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  )
}
