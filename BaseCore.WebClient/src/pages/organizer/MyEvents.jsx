import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleDateString('vi-VN') : '';
}

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    eventApi.getMine()
      .then((r) => setEvents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Xóa sự kiện này?')) return;

    try {
      await eventApi.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const filtered = filter === 'all' ? events : events.filter((e) => e.status === filter);
  const counts = {
    Pending: events.filter((e) => e.status === 'Pending').length,
    Approved: events.filter((e) => e.status === 'Approved').length,
    Completed: events.filter((e) => e.status === 'Completed').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Sự kiện của tôi</h1>
        <Link to="/events/create" className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-circle-plus" /> Tạo sự kiện
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Tất cả', count: events.length, color: 'bg-gray-50 border-gray-200' },
          { key: 'Pending', label: 'Chờ duyệt', count: counts.Pending, color: 'bg-yellow-50 border-yellow-200' },
          { key: 'Approved', label: 'Đang mở', count: counts.Approved, color: 'bg-green-50 border-green-200' },
          { key: 'Completed', label: 'Hoàn thành', count: counts.Completed, color: 'bg-blue-50 border-blue-200' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${filter === t.key ? 'border-primary-500 bg-primary-50' : `${t.color}`}`}
          >
            <p className="text-lg font-bold text-gray-900">{t.count}</p>
            <p className="text-xs text-gray-500">{t.label}</p>
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-calendar-xmark text-4xl text-gray-300 mb-3 block" />
          <p className="text-gray-500">Chưa có sự kiện nào</p>
          <Link to="/events/create" className="btn-primary btn-sm mt-4 inline-flex items-center gap-2">
            <i className="fa-solid fa-plus" /> Tạo ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => (
            <div key={ev.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-100 flex-shrink-0 overflow-hidden">
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fa-solid fa-calendar text-primary-300 text-xl" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{ev.title}</h3>
                  <StatusBadge status={ev.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <span><i className="fa-solid fa-calendar mr-1" />{fmt(ev.startDate)}</span>
                  {ev.location && <span><i className="fa-solid fa-location-dot mr-1" />{ev.location}</span>}
                  <span><i className="fa-solid fa-users mr-1" />{ev.currentParticipants}/{ev.maxParticipants}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {(ev.status === 'Approved' || ev.status === 'Completed') && (
                  <Link to={`/events/${ev.id}/manage`} className="btn-secondary btn-sm flex items-center gap-1">
                    <i className="fa-solid fa-list-check" /> Quản lý
                  </Link>
                )}
                <Link to={`/events/${ev.id}/edit`} className="btn-secondary btn-sm flex items-center gap-1">
                  <i className="fa-solid fa-pen" /> Sửa
                </Link>
                {ev.status === 'Pending' && (
                  <button onClick={() => handleDelete(ev.id)} className="btn-danger btn-sm flex items-center gap-1">
                    <i className="fa-solid fa-trash" />
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
