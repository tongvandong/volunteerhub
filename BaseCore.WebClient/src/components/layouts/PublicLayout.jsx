import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PublicLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Giới thiệu' },
    { to: '/events', label: 'Sự kiện' },
    { to: '/verify/check', label: 'Tra cứu chứng chỉ' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(255,255,255,0.98)',
          borderBottom: '1px solid #e5e7eb',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between" style={{ height: 60 }}>
            <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1b61c9' }}>
                <i className="fa-solid fa-leaf text-white text-sm" />
              </div>
              <span className="font-bold text-lg" style={{ color: '#181d26', letterSpacing: '-0.3px' }}>
                VolunteerHub
              </span>
            </Link>

            <nav className="hidden md:flex items-center p-1.5 bg-slate-100/60 rounded-full border border-slate-200/60 backdrop-blur-sm">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-5 py-2 rounded-full text-[14.5px] font-semibold tracking-wide transition-all duration-300 ease-out ${
                      active
                        ? 'text-primary-600 bg-white shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50/80'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary btn-sm">
                  <i className="fa-solid fa-gauge mr-1.5" style={{ fontSize: 12 }} />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary btn-sm hidden sm:inline-flex">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn-primary btn-sm hidden sm:inline-flex">
                    Đăng ký
                  </Link>
                </>
              )}
              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg"
                style={{ color: 'rgba(4,14,32,0.55)', background: menuOpen ? '#f0f5ff' : 'transparent' }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#181d26', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: '#1b61c9', textDecoration: 'none' }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: '#181d26', textDecoration: 'none' }}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer style={{ background: '#181d26' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1b61c9' }}>
                  <i className="fa-solid fa-leaf text-white" style={{ fontSize: 11 }} />
                </div>
                <span className="font-bold text-white text-base">VolunteerHub</span>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Kết nối tình nguyện viên với cộng đồng
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1">
              <div className="flex gap-4 text-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#7aaaf5')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                © 2026 VolunteerHub · CNTT59 - MTA
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
