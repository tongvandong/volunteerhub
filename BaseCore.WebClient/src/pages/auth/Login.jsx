import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRouteByRole } from '../../utils/navigation';

const BRAND_POINTS = [
  { icon: 'fa-wand-magic-sparkles', text: 'Gợi ý sự kiện phù hợp với kỹ năng của bạn' },
  { icon: 'fa-qrcode', text: 'Điểm danh QR/GPS, minh bạch giờ tình nguyện' },
  { icon: 'fa-award', text: 'Nhận huy hiệu và chứng chỉ chính thức' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(form.identifier, form.password);
    setLoading(false);

    if (result.success) {
      navigate(getDefaultRouteByRole(result.user?.role));
      return;
    }

    setError(result.message || 'Đăng nhập thất bại');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--c-canvas)' }}>
      <div
        className="relative overflow-hidden hidden lg:flex flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-800) 100%)' }}
      >
        <div style={{ position: 'absolute', top: -90, right: -70, width: 340, height: 340, borderRadius: '50%', background: 'rgba(240,97,47,0.30)' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <Link to="/" className="relative flex items-center gap-2.5 no-underline">
          <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.16)' }}>
            <i className="fa-solid fa-leaf text-white text-sm" />
          </div>
          <span className="font-bold text-lg text-white" style={{ letterSpacing: '-0.02em' }}>VolunteerHub</span>
        </Link>

        <div className="relative">
          <h2 className="text-white font-semibold leading-[1.1]" style={{ fontSize: 38, letterSpacing: '-0.02em' }}>
            Mỗi giờ bạn trao đi,<br />đều được ghi nhận.
          </h2>
          <div className="mt-8 space-y-4">
            {BRAND_POINTS.map((point) => (
              <div key={point.text} className="flex items-center gap-3">
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                  <i className={`fa-solid ${point.icon} text-sm`} />
                </span>
                <span className="text-[15px]" style={{ color: 'rgba(255,255,255,0.9)' }}>{point.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          © {new Date().getFullYear()} VolunteerHub · Kết nối tình nguyện, lan tỏa yêu thương
        </p>
      </div>

      <div className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-8 no-underline">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-700) 100%)' }}>
              <i className="fa-solid fa-leaf text-white text-sm" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--c-ink)', letterSpacing: '-0.02em' }}>VolunteerHub</span>
          </Link>

          <div className="card p-7 sm:p-8">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--c-ink)' }}>Chào mừng trở lại</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--c-ink-2)' }}>Đăng nhập để tiếp tục hành trình tình nguyện.</p>

            {error && (
              <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)' }}>
                <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" style={{ color: 'var(--c-danger)' }} />
                <span className="text-sm" style={{ color: '#b91c1c' }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-ink-2)' }}>Email hoặc tên đăng nhập</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--c-ink-3)' }} />
                  <input
                    type="text"
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    required
                    placeholder="Nhập email hoặc tên đăng nhập"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-ink-2)' }}>Mật khẩu</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--c-ink-3)' }} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Nhập mật khẩu"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: 'var(--c-primary)' }}>
                  Quên mật khẩu?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--c-ink-2)' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--c-primary)' }}>
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <p className="text-center text-xs mt-6">
            <Link to="/" className="hover:underline" style={{ color: 'var(--c-ink-3)' }}>
              <i className="fa-solid fa-arrow-left mr-1" />
              Quay lại trang giới thiệu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
