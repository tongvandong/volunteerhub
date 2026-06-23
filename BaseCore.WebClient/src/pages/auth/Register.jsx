import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';

const ROLES = [
  { value: 0, key: 'volunteer', label: 'Tình nguyện viên', icon: 'fa-hand-holding-heart', desc: 'Tham gia sự kiện và tích lũy giờ tình nguyện' },
  { value: 1, key: 'organizer', label: 'Nhà tổ chức', icon: 'fa-calendar-check', desc: 'Tạo và quản lý các chương trình, sự kiện cộng đồng' },
  { value: 2, key: 'sponsor', label: 'Nhà tài trợ', icon: 'fa-hand-holding-dollar', desc: 'Đồng hành, hỗ trợ nguồn lực cho các sự kiện' },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = ROLES.find((r) => r.key === searchParams.get('role'))?.value ?? 0;

  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    userType: initialRole,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Mật khẩu tối thiểu 8 ký tự');
      return;
    }

    setLoading(true);

    try {
      await authApi.register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const LABEL = 'block text-sm font-medium mb-1.5';

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--c-canvas)' }}>
      {/* Brand panel */}
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
            Tham gia cộng đồng<br />tình nguyện minh bạch.
          </h2>
          <p className="mt-5 text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Tạo tài khoản miễn phí trong 30 giây. Chọn đúng vai trò để vào đúng không gian làm việc.
          </p>
          <div className="mt-8 flex items-center gap-6">
            {[['2.400+', 'Tình nguyện viên'], ['320', 'Sự kiện'], ['1.150', 'Chứng chỉ']].map(([n, l]) => (
              <div key={l}>
                <div className="text-white font-semibold" style={{ fontSize: 24 }}>{n}</div>
                <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          © {new Date().getFullYear()} VolunteerHub · Kết nối tình nguyện, lan tỏa yêu thương
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-5 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-6 no-underline">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-700) 100%)' }}>
              <i className="fa-solid fa-leaf text-white text-sm" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--c-ink)', letterSpacing: '-0.02em' }}>VolunteerHub</span>
          </Link>

          <div className="card p-7 sm:p-8">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--c-ink)' }}>Tạo tài khoản</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--c-ink-2)' }}>Chọn đúng vai trò để vào đúng giao diện sau khi đăng nhập.</p>

            {error && (
              <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)' }}>
                <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" style={{ color: 'var(--c-danger)' }} />
                <span className="text-sm" style={{ color: '#b91c1c' }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Vai trò của bạn</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => {
                    const active = form.userType === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setForm({ ...form, userType: role.value })}
                        className="p-3 rounded-xl text-center transition-all"
                        style={{
                          border: `1.5px solid ${active ? 'var(--c-primary)' : 'var(--c-border-2)'}`,
                          background: active ? 'var(--c-primary-50)' : 'var(--c-surface)',
                        }}
                      >
                        <i className={`fa-solid ${role.icon} text-xl block mb-1.5`} style={{ color: active ? 'var(--c-primary)' : 'var(--c-ink-3)' }} />
                        <span className="text-xs font-medium" style={{ color: active ? 'var(--c-primary-700)' : 'var(--c-ink-2)' }}>
                          {role.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--c-ink-3)' }}>{ROLES.find((role) => role.value === form.userType)?.desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Tên đăng nhập *</label>
                  <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="input-field" placeholder="username" />
                </div>
                <div>
                  <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Mật khẩu *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="input-field" placeholder="Tối thiểu 8 ký tự" />
                </div>
              </div>

              <div>
                <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Họ và tên *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Nguyễn Văn A" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@example.com" />
                </div>
                <div>
                  <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Số điện thoại</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="0901234567" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--c-ink-2)' }}>
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--c-primary)' }}>
                Đăng nhập
              </Link>
              <span className="mx-2" style={{ color: 'var(--c-ink-3)' }}>·</span>
              <Link to="/forgot-password" className="font-medium hover:underline" style={{ color: 'var(--c-primary)' }}>
                Quên mật khẩu?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
