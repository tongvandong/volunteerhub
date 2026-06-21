import React, { useEffect, useMemo, useState } from 'react';
import { badgeApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

const EMPTY = {
  name: '',
  description: '',
  iconUrl: '',
  minEvents: '',
  minHours: '',
  minDonations: '',
  minDonated: '',
};

function parseCondition(condition) {
  try {
    const value = JSON.parse(condition || '{}');
    return {
      minEvents: value.min_events != null ? String(value.min_events) : '',
      minHours: value.min_hours != null ? String(value.min_hours) : '',
      minDonations: value.min_donations != null ? String(value.min_donations) : '',
      minDonated: value.min_donated != null ? String(value.min_donated) : '',
    };
  } catch {
    return { minEvents: '', minHours: '', minDonations: '', minDonated: '' };
  }
}

function buildCondition(form) {
  const condition = {};
  if (form.minEvents !== '') condition.min_events = Number(form.minEvents);
  if (form.minHours !== '') condition.min_hours = Number(form.minHours);
  if (form.minDonations !== '') condition.min_donations = Number(form.minDonations);
  if (form.minDonated !== '') condition.min_donated = Number(form.minDonated);
  return JSON.stringify(condition);
}

function conditionLabel(condition) {
  const parsed = parseCondition(condition);
  const parts = [];
  if (parsed.minEvents !== '') parts.push(`Tối thiểu ${parsed.minEvents} sự kiện`);
  if (parsed.minHours !== '') parts.push(`Tối thiểu ${parsed.minHours} giờ`);
  if (parsed.minDonations !== '') parts.push(`Tối thiểu ${parsed.minDonations} lần ủng hộ`);
  if (parsed.minDonated !== '') parts.push(`Ủng hộ tối thiểu ${parsed.minDonated}`);
  return parts.length ? parts.join(' · ') : 'Chưa có điều kiện';
}

export default function AdminBadges({ embedded = false }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const sortedBadges = useMemo(
    () => [...badges].sort((a, b) => a.id - b.id),
    [badges]
  );

  const load = () => {
    setLoading(true);
    badgeApi.getAll()
      .then((response) => setBadges(response.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = (badge) => {
    const parsed = parseCondition(badge.condition);
    setEditing(badge);
    setForm({
      name: badge.name || '',
      description: badge.description || '',
      iconUrl: badge.iconUrl || '',
      minEvents: parsed.minEvents,
      minHours: parsed.minHours,
      minDonations: parsed.minDonations,
      minDonated: parsed.minDonated,
    });
    setModal(true);
  };

  const closeModal = () => {
    if (!saving) {
      setModal(false);
      setEditing(null);
      setForm(EMPTY);
    }
  };

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập tên huy hiệu.';
    if (form.name.trim().length > 100) return 'Tên huy hiệu tối đa 100 ký tự.';
    if (form.description.trim().length > 500) return 'Mô tả tối đa 500 ký tự.';
    if (form.iconUrl.trim().length > 500) return 'URL icon tối đa 500 ký tự.';
    const nums = {
      'số sự kiện': form.minEvents,
      'số giờ': form.minHours,
      'số lần ủng hộ': form.minDonations,
      'số tiền ủng hộ': form.minDonated,
    };
    const provided = Object.entries(nums).filter(([, v]) => v !== '');
    if (provided.length === 0) return 'Cần ít nhất một điều kiện: số sự kiện, số giờ, số lần ủng hộ hoặc số tiền ủng hộ.';
    for (const [label, v] of provided) {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return `Điều kiện "${label}" không hợp lệ (phải là số không âm).`;
    }
    return null;
  };

  const submit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      iconUrl: form.iconUrl.trim(),
      condition: buildCondition(form),
    };

    setSaving(true);
    try {
      if (editing) {
        const response = await badgeApi.update(editing.id, payload);
        setBadges((prev) => prev.map((badge) => (badge.id === editing.id ? response.data : badge)));
      } else {
        const response = await badgeApi.create(payload);
        setBadges((prev) => [...prev, response.data]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Lưu huy hiệu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (badge) => {
    if (!confirm(`Xóa huy hiệu "${badge.name}"? Chỉ xóa được nếu chưa cấp cho người dùng.`)) return;

    setDeletingId(badge.id);
    try {
      await badgeApi.delete(badge.id);
      setBadges((prev) => prev.filter((item) => item.id !== badge.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa huy hiệu thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {embedded ? <span /> : (
          <div>
            <h1 className="text-xl font-bold text-warmink">Quản lý huy hiệu</h1>
            <p className="mt-1 text-sm text-warmink-2">Thêm, sửa điều kiện cấp huy hiệu. Chỉ xóa huy hiệu chưa từng cấp cho user.</p>
          </div>
        )}
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-plus" />
          Thêm huy hiệu
        </button>
      </div>

      {sortedBadges.length === 0 ? (
        <div className="card p-12 text-center text-warmink-2">
          <i className="fa-solid fa-medal mb-3 block text-4xl text-warmink-3" />
          Chưa có huy hiệu nào
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedBadges.map((badge) => (
            <div key={badge.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-50 text-amber-600">
                  {badge.iconUrl ? (
                    <img src={badge.iconUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-medal" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-warmink">{badge.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-warmink-2">{badge.description || 'Chưa có mô tả'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-warmborder bg-surface-2 p-3 text-sm text-warmink-2">
                <i className="fa-solid fa-list-check mr-1 text-warmink-3" />
                {conditionLabel(badge.condition)}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(badge)} className="btn-secondary btn-sm flex items-center gap-1">
                  <i className="fa-solid fa-pen" />
                  Sửa
                </button>
                <button type="button" onClick={() => remove(badge)} disabled={deletingId === badge.id} className="btn-danger btn-sm flex items-center gap-1">
                  {deletingId === badge.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <i className="fa-solid fa-trash" />}
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Sửa huy hiệu' : 'Thêm huy hiệu'} size="md">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-warmink-2">Tên huy hiệu *</label>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} maxLength={100} className="input-field" placeholder="VD: Chiến sĩ xanh" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warmink-2">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} maxLength={500} className="input-field resize-none" placeholder="Mô tả ngắn về huy hiệu..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warmink-2">Icon URL</label>
            <input value={form.iconUrl} onChange={(e) => setForm((prev) => ({ ...prev, iconUrl: e.target.value }))} maxLength={500} className="input-field" placeholder="/api/uploads/images/..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-warmink-2">Số sự kiện tối thiểu</label>
              <input type="number" min="0" value={form.minEvents} onChange={(e) => setForm((prev) => ({ ...prev, minEvents: e.target.value }))} className="input-field" placeholder="VD: 3" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-warmink-2">Số giờ tối thiểu</label>
              <input type="number" min="0" step="0.5" value={form.minHours} onChange={(e) => setForm((prev) => ({ ...prev, minHours: e.target.value }))} className="input-field" placeholder="VD: 20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-warmink-2">Số lần ủng hộ tối thiểu</label>
              <input type="number" min="0" value={form.minDonations} onChange={(e) => setForm((prev) => ({ ...prev, minDonations: e.target.value }))} className="input-field" placeholder="VD: 1" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-warmink-2">Tổng tiền ủng hộ tối thiểu</label>
              <input type="number" min="0" step="1000" value={form.minDonated} onChange={(e) => setForm((prev) => ({ ...prev, minDonated: e.target.value }))} className="input-field" placeholder="VD: 1000000" />
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Nếu huy hiệu đã cấp cho user, nên sửa tên/mô tả nhẹ nhàng. Không nên đổi điều kiện làm sai ý nghĩa lịch sử đã cấp.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Lưu huy hiệu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
