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
    </div>
  );
}
