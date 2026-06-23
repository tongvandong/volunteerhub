import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await authApi.forgotPassword(identifier);
      setMessage(response.data?.message || 'Nếu tài khoản tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.');
    } catch (err) {
      setError(err.response?.data?.message || 'Chưa gửi được email đặt lại mật khẩu. Vui lòng thử lại sau.');
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
          <h1 className="text-[22px] font-semibold" style={{ color: 'var(--c-ink)' }}>Quên mật khẩu</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ink-2)' }}>
            Nhập email hoặc tên đăng nhập. Nếu tài khoản tồn tại, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>

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
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-ink-2)' }}>Email hoặc tên đăng nhập</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--c-ink-3)' }} />
                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Đang gửi email...' : 'Gửi liên kết đặt lại'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--c-ink-2)' }}>
            Đã nhớ mật khẩu?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--c-primary)' }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
