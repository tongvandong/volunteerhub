import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({ newPassword: '', confirmNewPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmNewPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        token,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      setMessage(response.data?.message || 'Đặt lại mật khẩu thành công.');
      setForm({ newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'var(--c-canvas)' }}>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 no-underline">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-700) 100%)' }}>
            <i className="fa-solid fa-leaf text-white text-sm" />
          </div>
          <span className="font-bold text-lg" style={{ color: 'var(--c-ink)', letterSpacing: '-0.02em' }}>VolunteerHub</span>
        </Link>

        <div className="card p-7 sm:p-8">
          <h1 className="text-[22px] font-semibold" style={{ color: 'var(--c-ink)' }}>Đặt lại mật khẩu</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ink-2)' }}>
            Tạo mật khẩu mới cho tài khoản của bạn. Liên kết chỉ có hiệu lực trong thời gian ngắn.
          </p>

          {!token && (
            <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)' }}>
              <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" style={{ color: 'var(--c-danger)' }} />
              <span className="text-sm" style={{ color: '#b91c1c' }}>Liên kết đặt lại mật khẩu không hợp lệ.</span>
            </div>
          )}

          {message && (
            <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <i className="fa-solid fa-circle-check mt-0.5 flex-shrink-0" style={{ color: '#16a34a' }} />
              <span className="text-sm" style={{ color: '#166534' }}>{message}</span>
            </div>
          )}

          {error && (
            <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)' }}>
              <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" style={{ color: 'var(--c-danger)' }} />
              <span className="text-sm" style={{ color: '#b91c1c' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-ink-2)' }}>Mật khẩu mới</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                required
                minLength={8}
                className="input-field"
                placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-ink-2)' }}>Xác nhận mật khẩu</label>
              <input
                type="password"
                value={form.confirmNewPassword}
                onChange={(event) => setForm({ ...form, confirmNewPassword: event.target.value })}
                required
                minLength={8}
                className="input-field"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <button type="submit" disabled={loading || !token} className="btn-primary w-full justify-center">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </form>

          <p className="text-center text-sm mt-6">
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--c-primary)' }}>
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
