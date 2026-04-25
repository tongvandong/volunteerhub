import React, { useState, useEffect } from 'react';
import { eventApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleDateString('vi-VN') : '';
}

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState({});

  const load = (p = 1, status = filter) => {
    setLoading(true);
    const params = { page: p, pageSize: 15 };
    if (status !== 'all') params.status = status;

    eventApi.getAll(params)
      .then((r) => {
        setEvents(r.data?.items || []);
        setTotalPages(r.data?.totalPages || 1);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1, filter);
  }, [filter]);

  const setAction = (id, val) => setActionLoading((prev) => ({ ...prev, [id]: val }));

  const getErrorMessage = (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Thất bại';
    return `[${status || 'Network'}] ${msg}`;
  };

  const approve = async (id) => {
    setAction(id, 'approve');
    try {
      await eventApi.approve(id);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'Approved' } : e)));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setAction(id, null);
    }
  };

  const reject = async (id) => {
    const reason = prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) return;

    setAction(id, 'reject');
    try {
      await eventApi.reject(id, { reason });
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'Rejected' } : e)));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setAction(id, null);
    }
  };

  const complete = async (id) => {
    if (!confirm('Đánh dấu sự kiện này là hoàn thành?')) return;

    setAction(id, 'complete');
    try {
      await eventApi.complete(id);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'Completed' } : e)));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setAction(id, null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Duyệt sự kiện</h1>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'Pending', label: 'Chờ duyệt' },
          { key: 'Approved', label: 'Đã duyệt' },
          { key: 'Completed', label: 'Hoàn thành' },
          { key: 'Rejected', label: 'Từ chối' },
          { key: 'all', label: 'Tất cả' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === t.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : events.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-calendar-check text-4xl text-gray-300 mb-3 block" />
          <p className="text-gray-500">Không có sự kiện nào</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Sự kiện</th>
                <th className="text-left px-4 py-3">Ban tổ chức</th>
                <th className="text-left px-4 py-3">Thời gian</th>
                <th className="text-left px-4 py-3">Người tham gia</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((ev) => (
                <tr key={ev.id} className="odd:bg-gray-50/50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 max-w-xs truncate">{ev.title}</div>
                    {ev.location && <div className="text-xs text-gray-400 mt-0.5"><i className="fa-solid fa-location-dot mr-1" />{ev.location}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ev.organizer?.name || ev.organizer?.userName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{fmt(ev.startDate)}</div>
                    <div className="text-xs text-gray-400">→ {fmt(ev.endDate)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ev.currentParticipants}/{ev.maxParticipants}</td>
                  <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {ev.status === 'Pending' && (
                        <>
                          <button onClick={() => approve(ev.id)} disabled={!!actionLoading[ev.id]} className="btn-primary btn-sm text-xs flex items-center gap-1">
                            {actionLoading[ev.id] === 'approve'
                              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <i className="fa-solid fa-check" />}
                            Duyệt
                          </button>
                          <button onClick={() => reject(ev.id)} disabled={!!actionLoading[ev.id]} className="btn-danger btn-sm text-xs flex items-center gap-1">
                            {actionLoading[ev.id] === 'reject'
                              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <i className="fa-solid fa-xmark" />}
                            Từ chối
                          </button>
                        </>
                      )}
                      {ev.status === 'Approved' && (
                        <button onClick={() => complete(ev.id)} disabled={!!actionLoading[ev.id]} className="btn-secondary btn-sm text-xs flex items-center gap-1">
                          {actionLoading[ev.id] === 'complete'
                            ? <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            : <i className="fa-solid fa-flag-checkered" />}
                          Hoàn thành
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => load(p)} />
      )}
    </div>
  );
}
