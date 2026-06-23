import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';

const ROLES = [
  { value: 0, key: 'volunteer', label: 'Tình nguyện viên', icon: 'fa-hand-holding-heart', desc: 'Tìm sự kiện, đăng ký tham gia và tích lũy giờ tình nguyện.' },
  { value: 1, key: 'organizer', label: 'Nhà tổ chức', icon: 'fa-calendar-check', desc: 'Tạo sự kiện, duyệt tình nguyện viên và ghi nhận đóng góp.' },
  { value: 2, key: 'sponsor', label: 'Nhà tài trợ', icon: 'fa-hand-holding-dollar', desc: 'Gửi đề nghị tài trợ và theo dõi các dự án đã đồng hành.' },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = ROLES.find((role) => role.key === searchParams.get('role'))?.value ?? 0;

  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    userType: initialRole,
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRole = useMemo(
    () => ROLES.find((role) => role.value === form.userType) ?? ROLES[0],
    [form.userType]
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateLocal = () => {
    if (!form.username.trim()) return 'Vui lòng nhập tên đăng nhập.';
    if (!form.name.trim()) return 'Vui lòng nhập họ tên.';
    if (!form.email.trim()) return 'Email là bắt buộc để nhận mã xác minh đăng ký.';
    if (form.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      return 'Mật khẩu phải có ít nhất một chữ cái và một chữ số.';
    }
    return '';
  };

  const requestCode = async (event) => {
    event?.preventDefault();
    setError('');
    setMessage('');

    const localError = validateLocal();
    if (localError) {
      setError(localError);
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        ...form,
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setMaskedEmail(response.data?.email || form.email.trim());
      setMessage(response.data?.message || 'Đã gửi mã xác minh đăng ký đến email của bạn.');
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Không gửi được mã xác minh đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Mã xác minh phải gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyRegistration({
        username: form.username.trim(),
        email: form.email.trim(),
        code,
      });
      navigate('/login', {
        state: {
          registered: true,
          message: 'Xác minh email thành công. Bạn có thể đăng nhập.',
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không xác minh được mã đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const LABEL = 'block text-sm font-medium mb-1.5';

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
            Đăng ký bằng email<br />để bảo vệ tài khoản.
          </h2>
          <p className="mt-5 text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Hệ thống sẽ gửi mã 6 số đến email của bạn. Tài khoản chỉ được tạo sau khi xác minh thành công.
          </p>
          <div className="mt-8 flex items-center gap-6">
            {[['6 số', 'Mã xác minh'], ['10 phút', 'Hiệu lực'], ['3 vai trò', 'Đăng ký công khai']].map(([n, l]) => (
              <div key={l}>
                <div className="text-white font-semibold" style={{ fontSize: 24 }}>{n}</div>
                <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          © {new Date().getFullYear()} VolunteerHub · CNTT59 - MTA
        </p>
      </div>

      <div className="flex items-center justify-center p-5 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-6 no-underline">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-700) 100%)' }}>
              <i className="fa-solid fa-leaf text-white text-sm" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--c-ink)', letterSpacing: '-0.02em' }}>VolunteerHub</span>
          </Link>

          <div className="card p-7 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-semibold" style={{ color: 'var(--c-ink)' }}>
                  {step === 'form' ? 'Tạo tài khoản' : 'Xác minh email'}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--c-ink-2)' }}>
                  {step === 'form'
                    ? 'Chọn vai trò và nhập email thật để nhận mã xác minh.'
                    : `Nhập mã 6 số đã gửi đến ${maskedEmail || form.email}.`}
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: 'var(--c-primary)', background: 'var(--c-primary-50)' }}>
                Bước {step === 'form' ? '1/2' : '2/2'}
              </div>
            </div>

            {error && (
              <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)' }}>
                <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" style={{ color: 'var(--c-danger)' }} />
                <span className="text-sm" style={{ color: '#b91c1c' }}>{error}</span>
              </div>
            )}

            {message && (
              <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.18)' }}>
                <i className="fa-solid fa-circle-check mt-0.5 flex-shrink-0" style={{ color: '#15803d' }} />
                <span className="text-sm" style={{ color: '#166534' }}>{message}</span>
              </div>
            )}

            {step === 'form' ? (
              <form onSubmit={requestCode} className="mt-5 space-y-4">
                <div>
                  <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Vai trò của bạn</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((role) => {
                      const active = form.userType === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => updateForm('userType', role.value)}
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
                  <p className="text-xs mt-2" style={{ color: 'var(--c-ink-3)' }}>{selectedRole.desc}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Tên đăng nhập *</label>
                    <input type="text" value={form.username} onChange={(e) => updateForm('username', e.target.value)} required className="input-field" placeholder="username" />
                  </div>
                  <div>
                    <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Mật khẩu *</label>
                    <input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} required className="input-field" placeholder="Ít nhất 8 ký tự, có chữ và số" />
                  </div>
                </div>

                <div>
                  <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Họ và tên *</label>
                  <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required className="input-field" placeholder="Nguyễn Văn A" />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Email nhận mã *</label>
                    <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} required className="input-field" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Số điện thoại</label>
                    <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="input-field" placeholder="0901234567" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Đang gửi mã...' : 'Gửi mã xác minh'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="mt-5 space-y-4">
                <div>
                  <label className={LABEL} style={{ color: 'var(--c-ink-2)' }}>Mã xác minh 6 số *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="input-field text-center font-semibold"
                    style={{ fontSize: 24, letterSpacing: 8 }}
                    placeholder="000000"
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--c-ink-3)' }}>
                    Mã có hiệu lực trong 10 phút. Nếu chưa thấy email, hãy kiểm tra thư rác.
                  </p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Đang xác minh...' : 'Xác minh và tạo tài khoản'}
                </button>

                <div className="grid sm:grid-cols-2 gap-2">
                  <button type="button" disabled={loading} onClick={requestCode} className="btn-secondary justify-center">
                    Gửi lại mã
                  </button>
                  <button type="button" disabled={loading} onClick={() => setStep('form')} className="btn-secondary justify-center">
                    Sửa thông tin
                  </button>
                </div>
              </form>
            )}

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
