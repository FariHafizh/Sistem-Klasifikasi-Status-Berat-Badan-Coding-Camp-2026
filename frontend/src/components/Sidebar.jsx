import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sparkles, History, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Rekomendasi', href: '/recommendation', icon: Sparkles },
  { label: 'History', href: '/history', icon: History },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-blue-100 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-50">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/favicon.webp"
            alt="logo"
            className="w-7 h-7 object-contain"
          />
          <span className="font-bold text-primary text-sm tracking-tight">
            WeightAct
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  active
                    ? 'bg-bg text-primary'
                    : 'text-gray-500 hover:bg-[#f0f7ff] hover:text-primary'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-blue-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
