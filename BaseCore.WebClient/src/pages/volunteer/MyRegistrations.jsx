import React, { useState, useEffect } from 'react';
import { registrationApi, ratingApi } from '../../services/api';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function fmt(dt) { return dt ? new Date(dt).toLocaleDateString('vi-VN') : ''; }

export default function MyRegistrations() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [ratingForms, setRatingForms] = useState({});

  useEffect(() => {
    registrationApi.getMyRegistrations()
      .then(r => setRegs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const withdraw = async (eventId) => {
    if (!confirm('Bạn có chắc muốn rút đăng ký?')) return;
    try {
      await registrationApi.withdraw(eventId);
      setRegs(prev => prev.filter(r => r.eventId !== eventId));
    } catch (err) { alert(err.response?.data?.message || 'Rút đăng ký thất bại'); }
  };

  const submitRating = async (registration) => {
    const form = ratingForms[registration.id] || { score: 5, comment: '' };
    const rateeId = registration.event?.organizerId;
    if (!rateeId) return alert('Không tìm thấy ban tổ chức để đánh giá');

    try {
      await ratingApi.create(registration.eventId, {
        rateeId,
        score: Number(form.score) || 5,
        comment: form.comment || '',
      });
      setRatingForms((prev) => ({
        ...prev,
        [registration.id]: { ...form, done: true },
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Đánh giá thất bại');
    }
  };

  const filtered = filter === 'all' ? regs : regs.filter(r => filter === 'attended' ? r.isAttended : r.status === filter);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Đăng ký của tôi</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'Pending', label: 'Chờ xác nhận' },
          { key: 'Confirmed', label: 'Đã xác nhận' },
          { key: 'attended', label: 'Đã tham gia' },
          { key: 'Cancelled', label: 'Đã hủy' },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === t.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}>
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">
              {t.key === 'all' ? regs.length
                : t.key === 'attended' ? regs.filter(r => r.isAttended).length
                : regs.filter(r => r.status === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-clipboard-list text-4xl text-gray-300 mb-3 block" />
          <p className="text-gray-500">Không có đăng ký nào</p>
          <Link to="/" className="btn-primary btn-sm mt-4 inline-flex items-center gap-2">
            <i className="fa-solid fa-search" /> Tìm sự kiện
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <Link to={`/events/${r.eventId}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 block truncate">
                  {r.event?.title || `Sự kiện #${r.eventId}`}
                </Link>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                  <span><i className="fa-solid fa-calendar mr-1" />{fmt(r.event?.startDate)}</span>
                  {r.event?.location && <span><i className="fa-solid fa-location-dot mr-1" />{r.event.location}</span>}
                  <span>Đăng ký: {fmt(r.registeredAt)}</span>
                  {r.isAttended && <span className="text-primary-600 font-medium"><i className="fa-solid fa-clock mr-1" />{r.volunteerHours}h</span>}
                </div>
                {r.note && <p className="text-xs text-gray-400 mt-1 italic">"{r.note}"</p>}
                {r.isAttended && r.event?.status === 'Completed' && (
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    {ratingForms[r.id]?.done ? (
                      <p className="text-xs font-medium text-green-700">
                        <i className="fa-solid fa-check mr-1" /> Đã gửi đánh giá ban tổ chức
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={ratingForms[r.id]?.score || 5}
                          onChange={(e) => setRatingForms((prev) => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), score: e.target.value } }))}
                          className="input-field text-xs sm:w-24"
                        >
                          {[5, 4, 3, 2, 1].map((score) => <option key={score} value={score}>{score} sao</option>)}
                        </select>
                        <input
                          value={ratingForms[r.id]?.comment || ''}
                          onChange={(e) => setRatingForms((prev) => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), comment: e.target.value } }))}
                          className="input-field text-xs"
                          placeholder="Nhận xét về ban tổ chức..."
                        />
                        <button onClick={() => submitRating(r)} className="btn-primary btn-sm text-xs">
                          Gửi đánh giá
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.isAttended ? 'Confirmed' : r.status} />
                {r.isAttended && <span className="text-xs bg-primary-50 text-primary-600 border border-primary-100 px-2 py-0.5 rounded-full font-medium">✓ Đã điểm danh</span>}
                {r.status === 'Pending' && (
                  <button onClick={() => withdraw(r.eventId)} className="btn-danger btn-sm text-xs">
                    <i className="fa-solid fa-xmark mr-1" /> Rút đăng ký
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
