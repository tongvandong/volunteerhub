import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sponsorApi, eventApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleDateString('vi-VN') : '';
}

export default function MySponsorships() {
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ eventId: '', amount: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [trackingModal, setTrackingModal] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const loadSponsorships = async () => {
    const r = await sponsorApi.getMySponsorships();
    setSponsorships(r.data || []);
  };

  useEffect(() => {
    eventApi.getAll({ status: 'Approved', pageSize: 100 })
      .then((r) => setAllEvents(r.data?.items || []))
      .catch(() => {});

    loadSponsorships()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await sponsorApi.addSponsor(form.eventId, {
        contributionType: 'Financial',
        amount: parseFloat(form.amount),
        note: form.description,
      });
      await loadSponsorships();
      setAddModal(false);
      setForm({ eventId: '', amount: '', description: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Tài trợ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = sponsorships.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const openTracking = async (sponsorshipId) => {
    setTrackingModal(true);
    setTracking(null);
    setTrackingLoading(true);

    try {
      const res = await sponsorApi.getMySponsorshipTracking(sponsorshipId);
      setTracking(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Không tải được tiến độ tài trợ');
      setTrackingModal(false);
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tài trợ của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sponsorships.length} sự kiện được tài trợ</p>
        </div>
        <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-circle-plus" /> Thêm tài trợ
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 bg-gradient-to-br from-primary-50 to-green-50 border-primary-200">
          <p className="text-sm text-gray-500 mb-1">Tổng số tiền tài trợ</p>
          <p className="text-2xl font-bold text-primary-700">
            {totalAmount.toLocaleString('vi-VN')} <span className="text-base font-normal">đ</span>
          </p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <p className="text-sm text-gray-500 mb-1">Sự kiện được tài trợ</p>
          <p className="text-2xl font-bold text-blue-700">{sponsorships.length}</p>
        </div>
      </div>

      {sponsorships.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-handshake text-5xl text-gray-300 mb-4 block" />
          <p className="text-gray-500 font-medium">Chưa có tài trợ nào</p>
          <p className="text-gray-400 text-sm mt-1">Hãy chọn một sự kiện để bắt đầu tài trợ</p>
          <button onClick={() => setAddModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <i className="fa-solid fa-plus" /> Thêm tài trợ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsorships.map((s) => (
            <div key={s.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-handshake text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/events/${s.eventId}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 block truncate">
                  {s.event?.title || `Sự kiện #${s.eventId}`}
                </Link>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                  {s.event?.startDate && <span><i className="fa-solid fa-calendar mr-1" />{fmt(s.event.startDate)}</span>}
                  {s.event?.location && <span><i className="fa-solid fa-location-dot mr-1" />{s.event.location}</span>}
                  {s.note && <span className="italic">"{s.note}"</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.event?.status && <StatusBadge status={s.event.status} />}
                <span className="text-primary-700 font-bold text-sm bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                  {(Number(s.amount) || 0).toLocaleString('vi-VN')}đ
                </span>
                <button onClick={() => openTracking(s.id)} className="btn-secondary btn-sm flex items-center gap-1">
                  <i className="fa-solid fa-chart-line" /> Theo dõi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Thêm tài trợ" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sự kiện *</label>
            <select value={form.eventId} onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))} required className="input-field">
              <option value="">-- Chọn sự kiện --</option>
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            {allEvents.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Hiện chưa có sự kiện đã duyệt để tài trợ.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ) *</label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              className="input-field"
              placeholder="VD: 5000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input-field resize-none"
              placeholder="Thông tin tài trợ, điều khoản..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={saving || allEvents.length === 0} className="btn-primary flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <i className="fa-solid fa-handshake" /> Xác nhận tài trợ
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={trackingModal} onClose={() => setTrackingModal(false)} title="Theo dõi tài trợ" size="lg">
        {trackingLoading ? (
          <LoadingSpinner />
        ) : tracking ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{tracking.eventInfo?.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {tracking.eventInfo?.organizer} · {tracking.eventInfo?.category} · {tracking.eventInfo?.location}
                  </p>
                </div>
                <StatusBadge status={tracking.eventInfo?.status} />
              </div>
            </div>

            <div className="rounded-lg border border-primary-100 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Tiến độ dự án</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tracking.impact?.milestoneCount
                      ? `${tracking.impact.completedMilestones || 0}/${tracking.impact.milestoneCount} mốc hoàn thành`
                      : 'Tính theo trạng thái sự kiện hiện tại'}
                  </p>
                </div>
                <span className="text-lg font-bold text-primary-700">{tracking.impact?.projectProgress || 0}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-primary-500" style={{ width: `${Math.min(tracking.impact?.projectProgress || 0, 100)}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Đăng ký', value: tracking.impact?.totalRegistrations || 0, icon: 'fa-clipboard-list' },
                { label: 'Đã điểm danh', value: tracking.impact?.attendedVolunteers || 0, icon: 'fa-user-check' },
                { label: 'Giờ đóng góp', value: `${tracking.impact?.totalVolunteerHours || 0}h`, icon: 'fa-clock' },
                { label: 'Chứng chỉ', value: tracking.impact?.certificatesIssued || 0, icon: 'fa-certificate' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <i className={`fa-solid ${item.icon} text-primary-600 mb-2`} />
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-primary-100 bg-primary-50 p-3 text-sm text-primary-800">
              <p className="font-semibold">Tổng tài trợ cho sự kiện</p>
              <p className="mt-1">
                {(Number(tracking.impact?.sponsorAmount) || 0).toLocaleString('vi-VN')}đ từ {tracking.impact?.sponsorCount || 0} nhà tài trợ.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Timeline tiến độ</h3>
              <div className="space-y-3">
                {(tracking.timeline || []).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.status === 'Done' ? 'bg-green-100 text-green-700' :
                        item.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'Blocked' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <i className={`fa-solid ${item.status === 'Done' ? 'fa-check' : item.status === 'InProgress' ? 'fa-spinner' : item.status === 'Blocked' ? 'fa-triangle-exclamation' : 'fa-hourglass-half'} text-xs`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <span className="text-xs text-gray-400">{fmt(item.date)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      {typeof item.progressPercent === 'number' && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full bg-primary-500" style={{ width: `${Math.min(item.progressPercent, 100)}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-gray-500">{item.progressPercent}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
