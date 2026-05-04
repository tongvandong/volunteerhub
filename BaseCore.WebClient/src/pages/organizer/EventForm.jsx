import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventApi, eventCategoryApi, skillApi } from '../../services/api';

const LocationPickerMap = lazy(() => import('../../components/ui/LocationPickerMap'));

const INIT = {
  title: '',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  startDate: '',
  endDate: '',
  maxParticipants: 50,
  categoryId: '',
  imageUrl: '',
  requiredSkillIds: '[]',
};

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(INIT);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  const selectedSkillIds = (() => {
    try {
      return JSON.parse(form.requiredSkillIds || '[]');
    } catch {
      return [];
    }
  })();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setMapLocation = useCallback(({ latitude, longitude }) => {
    setForm((f) => ({ ...f, latitude, longitude }));
  }, []);

  const toggleSkill = (skillId) => {
    const next = selectedSkillIds.includes(skillId)
      ? selectedSkillIds.filter((x) => x !== skillId)
      : [...selectedSkillIds, skillId];
    set('requiredSkillIds', JSON.stringify(next));
  };

  useEffect(() => {
    eventCategoryApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});
    skillApi.getAll().then((r) => setSkills(r.data || [])).catch(() => {});

    if (isEdit) {
      eventApi.getById(id)
        .then((r) => {
          const ev = r.data;
          setForm({
            title: ev.title || '',
            description: ev.description || '',
            location: ev.location || '',
            latitude: ev.latitude || '',
            longitude: ev.longitude || '',
            startDate: ev.startDate ? ev.startDate.slice(0, 16) : '',
            endDate: ev.endDate ? ev.endDate.slice(0, 16) : '',
            maxParticipants: ev.maxParticipants || 50,
            categoryId: ev.categoryId || '',
            imageUrl: ev.imageUrl || '',
            requiredSkillIds: ev.requiredSkillIds || '[]',
          });
        })
        .catch(() => navigate('/my-events'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const latitude = form.latitude ? parseFloat(form.latitude) : null;
    const longitude = form.longitude ? parseFloat(form.longitude) : null;

    if (!form.location.trim()) {
      setError('Vui lòng nhập địa điểm sự kiện.');
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('Vui lòng chọn vị trí trên bản đồ hoặc nhập đầy đủ latitude/longitude.');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Tọa độ không hợp lệ. Latitude phải từ -90 đến 90, longitude phải từ -180 đến 180.');
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      latitude,
      longitude,
      maxParticipants: parseInt(form.maxParticipants),
      categoryId: parseInt(form.categoryId),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    };

    try {
      if (isEdit) await eventApi.update(id, payload);
      else await eventApi.create(payload);
      navigate('/my-events');
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu sự kiện thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote('Trình duyệt không hỗ trợ định vị. Bạn vẫn có thể click trên bản đồ hoặc nhập tọa độ thủ công.');
      return;
    }

    setLocating(true);
    setLocationNote('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapLocation({
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        });
        setLocating(false);
      },
      () => {
        setLocationNote('Không lấy được vị trí hiện tại. Hãy kiểm tra quyền định vị hoặc click trực tiếp trên bản đồ.');
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <i className="fa-solid fa-circle-exclamation flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sự kiện *</label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required className="input-field" placeholder="VD: Ngày hội trồng cây xanh 2025" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className="input-field resize-none" placeholder="Mô tả chi tiết về sự kiện..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required className="input-field">
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tối đa *</label>
              <input type="number" min={1} value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} required className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL ảnh bìa</label>
            <input type="url" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} className="input-field" placeholder="https://..." />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Thời gian & địa điểm</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu *</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc *</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm *</label>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} required className="input-field" placeholder="Số nhà, đường, quận, thành phố..." />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700">Chọn vị trí trên bản đồ *</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="btn-secondary btn-sm flex items-center gap-2"
              >
                <i className={`fa-solid fa-location-crosshairs ${locating ? 'fa-spin' : ''}`} />
                {locating ? 'Đang định vị...' : 'Lấy vị trí hiện tại'}
              </button>
            </div>
            <Suspense fallback={<div className="h-72 rounded-xl bg-gray-100 animate-pulse" />}>
              <LocationPickerMap
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={setMapLocation}
                height={300}
              />
            </Suspense>
            <p className="text-xs text-gray-400">
              Click trên bản đồ hoặc kéo marker để cập nhật tọa độ. Tọa độ là bắt buộc để sự kiện xuất hiện trên bản đồ công khai và bộ lọc gần tôi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vĩ độ (Latitude)
                <span className="ml-1 text-xs font-normal text-gray-400">- dùng cho bản đồ</span>
              </label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} required className="input-field" placeholder="10.7769" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ (Longitude)</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} required className="input-field" placeholder="106.7009" />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            <i className="fa-solid fa-circle-info mr-1" />
            Tọa độ giúp sự kiện hiển thị trên bản đồ tình nguyện. Tra cứu tại{' '}
            <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ color: '#1b61c9' }}>Google Maps</a>.
          </p>
          {!form.latitude || !form.longitude ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <i className="fa-solid fa-triangle-exclamation mr-1" />
              Vui lòng chọn tọa độ trước khi lưu sự kiện.
            </div>
          ) : null}
          {locationNote && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <i className="fa-solid fa-circle-info mr-1" />
              {locationNote}
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className="card p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Kỹ năng yêu cầu</h2>
              <p className="text-xs text-gray-400 mt-0.5">Chọn các kỹ năng tình nguyện viên cần có để hệ thống gợi ý sự kiện phù hợp.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => {
                const checked = selectedSkillIds.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.13s',
                      background: checked ? '#1b61c9' : 'rgba(4,14,32,0.06)',
                      color: checked ? '#fff' : 'rgba(4,14,32,0.60)',
                      boxShadow: checked ? '0 2px 8px rgba(27,97,201,0.25)' : 'none',
                    }}>
                    {checked && <i className="fa-solid fa-check mr-1.5" style={{ fontSize: 10 }} />}
                    {s.name}
                    {s.category && <span style={{ opacity: 0.65, marginLeft: 4, fontSize: 11 }}>· {s.category}</span>}
                  </button>
                );
              })}
            </div>
            {selectedSkillIds.length > 0 && (
              <p className="text-xs" style={{ color: '#1b61c9' }}>
                Đã chọn {selectedSkillIds.length} kỹ năng - hệ thống sẽ gợi ý sự kiện này cho tình nguyện viên có kỹ năng phù hợp.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <i className="fa-solid fa-floppy-disk" /> {isEdit ? 'Lưu thay đổi' : 'Tạo sự kiện'}
          </button>
        </div>
      </form>

      {!isEdit && (
        <p className="text-xs text-center text-gray-400">
          <i className="fa-solid fa-info-circle mr-1" /> Sự kiện sẽ ở trạng thái <strong>Chờ duyệt</strong> cho đến khi Admin phê duyệt
        </p>
      )}
    </div>
  );
}
