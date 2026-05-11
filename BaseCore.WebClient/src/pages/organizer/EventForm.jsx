import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { eventApi, eventCategoryApi, organizerVerificationApi, skillApi } from '../../services/api';
import ImageUploadField from '../../components/ui/ImageUploadField';

const LocationPickerMap = lazy(() => import('../../components/ui/LocationPickerMap'));

const INIT = {
  title: '',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  startDate: '',
  endDate: '',
  minParticipants: 1,
  maxParticipants: 50,
  requiresKyc: false,
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
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressError, setAddressError] = useState('');
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [verification, setVerification] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(!isEdit);

  const selectedSkillIds = (() => {
    try {
      return JSON.parse(form.requiredSkillIds || '[]');
    } catch {
      return [];
    }
  })();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setReverseGeocoding(true);
    setAddressError('');
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(lat),
        lon: String(lng),
        'accept-language': 'vi',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
      if (!response.ok) throw new Error('reverse failed');
      const result = await response.json();
      const label = result?.display_name || `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
      setForm((f) => ({ ...f, location: label }));
      setAddressSuggestions([]);
      setLocationNote('Đã cập nhật địa chỉ theo vị trí được chọn trên bản đồ.');
    } catch {
      setAddressError('Đã cập nhật tọa độ nhưng chưa lấy được địa chỉ tương ứng.');
    } finally {
      setReverseGeocoding(false);
    }
  }, []);

  const setMapLocation = useCallback(({ latitude, longitude }) => {
    setForm((f) => ({ ...f, latitude, longitude }));
    reverseGeocode(latitude, longitude);
  }, [reverseGeocode]);

  const searchAddress = useCallback(async (query) => {
    const normalizedQuery = query.trim();
    setAddressError('');
    setAddressSuggestions([]);

    if (normalizedQuery.length < 3) {
      return;
    }

    setAddressSearching(true);
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: normalizedQuery,
        limit: '5',
        countrycodes: 'vn',
        addressdetails: '1',
        'accept-language': 'vi',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      if (!response.ok) throw new Error('search failed');
      const results = await response.json();
      setAddressSuggestions((results || []).map((item) => ({
        id: item.place_id,
        label: item.display_name,
        latitude: Number(item.lat).toFixed(6),
        longitude: Number(item.lon).toFixed(6),
      })));
      if (!results?.length) {
        setAddressError('Không tìm thấy địa chỉ phù hợp. Bạn vẫn có thể click trực tiếp trên bản đồ.');
      }
    } catch {
      setAddressError('Không tìm được gợi ý lúc này. Hãy thử lại hoặc chọn trực tiếp trên bản đồ.');
    } finally {
      setAddressSearching(false);
    }
  }, []);

  const selectAddressSuggestion = (suggestion) => {
    setForm((f) => ({
      ...f,
      location: suggestion.label,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }));
    setAddressSuggestions([]);
    setAddressError('');
    setLocationNote('Đã chọn địa chỉ gợi ý và cập nhật vị trí trên bản đồ.');
  };

  const toggleSkill = (skillId) => {
    const next = selectedSkillIds.includes(skillId)
      ? selectedSkillIds.filter((x) => x !== skillId)
      : [...selectedSkillIds, skillId];
    set('requiredSkillIds', JSON.stringify(next));
  };

  useEffect(() => {
    eventCategoryApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});
    skillApi.getAll().then((r) => setSkills(r.data || [])).catch(() => {});

    if (!isEdit) {
      organizerVerificationApi.getMine()
        .then((r) => setVerification(r.data))
        .catch(() => setVerification({ status: 'Unverified', canCreateEvents: false }))
        .finally(() => setCheckingVerification(false));
    }

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
            minParticipants: ev.minParticipants || 1,
            maxParticipants: ev.maxParticipants || 50,
            requiresKyc: Boolean(ev.requiresKyc),
            categoryId: ev.categoryId || '',
            imageUrl: ev.imageUrl || '',
            requiredSkillIds: ev.requiredSkillIds || '[]',
          });
        })
        .catch(() => navigate('/my-events'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    const query = form.location.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      setAddressError('');
      return undefined;
    }

    const timer = window.setTimeout(() => {
      searchAddress(query);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [form.location, searchAddress]);

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

    const minParticipants = parseInt(form.minParticipants, 10);
    const maxParticipants = parseInt(form.maxParticipants, 10);
    if (!Number.isInteger(minParticipants) || minParticipants < 1) {
      setError('Số tình nguyện viên tối thiểu phải từ 1 trở lên.');
      return;
    }
    if (!Number.isInteger(maxParticipants) || maxParticipants < 1) {
      setError('Số tình nguyện viên tối đa phải từ 1 trở lên.');
      return;
    }
    if (minParticipants > maxParticipants) {
      setError('Số tối thiểu không được lớn hơn số tối đa.');
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      latitude,
      longitude,
      minParticipants,
      maxParticipants,
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
        const latitude = pos.coords.latitude.toFixed(6);
        const longitude = pos.coords.longitude.toFixed(6);
        setMapLocation({ latitude, longitude });
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

  if (!isEdit && checkingVerification) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isEdit && verification && !verification.canCreateEvents) {
    const statusLabel = {
      Unverified: 'Chưa gửi hồ sơ',
      PendingVerification: 'Đang chờ admin duyệt',
      ChangesRequested: 'Cần bổ sung thông tin',
      Rejected: 'Bị từ chối',
    }[verification.status] || verification.status;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="fa-solid fa-building-shield text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cần xác minh tổ chức trước khi tạo sự kiện</h1>
            <p className="text-sm text-gray-500 mt-2">
              Trạng thái hiện tại: <span className="font-semibold text-amber-700">{statusLabel}</span>.
              Sau khi admin duyệt hồ sơ, bạn có thể tạo sự kiện và gửi sự kiện đó vào luồng kiểm duyệt nội dung.
            </p>
          </div>
          {verification.adminNote && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-semibold">Phản hồi từ admin</p>
              <p className="mt-1">{verification.adminNote}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/organizer/verification" className="btn-primary text-center">
              Mở hồ sơ xác minh
            </Link>
            <button type="button" onClick={() => navigate('/my-events')} className="btn-secondary">
              Quay lại sự kiện của tôi
            </button>
          </div>
        </div>
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
            <input type="text" value={form.title} onInput={(e) => set('title', e.target.value)} onChange={(e) => set('title', e.target.value)} required className="input-field" placeholder="VD: Ngày hội trồng cây xanh 2025" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea rows={4} value={form.description} onInput={(e) => set('description', e.target.value)} onChange={(e) => set('description', e.target.value)} className="input-field resize-none" placeholder="Mô tả chi tiết về sự kiện..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
              <select value={form.categoryId} onInput={(e) => set('categoryId', e.target.value)} onChange={(e) => set('categoryId', e.target.value)} required className="input-field">
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tối đa *</label>
              <input type="number" min={1} value={form.maxParticipants} onInput={(e) => set('maxParticipants', e.target.value)} onChange={(e) => set('maxParticipants', e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tối thiểu *</label>
              <input type="number" min={1} value={form.minParticipants} onInput={(e) => set('minParticipants', e.target.value)} onChange={(e) => set('minParticipants', e.target.value)} required className="input-field" />
            </div>
          </div>
          <ImageUploadField
            label="Ảnh bìa"
            value={form.imageUrl}
            onChange={(url) => set('imageUrl', url)}
            helper="Upload ảnh từ máy để hiển thị trên trang danh sách và chi tiết sự kiện."
          />
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.requiresKyc}
              onChange={(e) => set('requiresKyc', e.target.checked)}
            />
            <span>
              Yêu cầu tình nguyện viên đã xác thực KYC mới được đăng ký sự kiện này.
            </span>
          </label>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Thời gian & địa điểm</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu *</label>
              <input type="datetime-local" value={form.startDate} onInput={(e) => set('startDate', e.target.value)} onChange={(e) => set('startDate', e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc *</label>
              <input type="datetime-local" value={form.endDate} onInput={(e) => set('endDate', e.target.value)} onChange={(e) => set('endDate', e.target.value)} required className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm *</label>
            <div className="relative">
              <input
                type="text"
                value={form.location}
                onInput={(e) => {
                  set('location', e.target.value);
                  setAddressError('');
                }}
                onChange={(e) => {
                  set('location', e.target.value);
                  setAddressError('');
                }}
                required
                className="input-field pr-10"
                placeholder="Số nhà, đường, quận, thành phố..."
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                {addressSearching || reverseGeocoding ? (
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="fa-solid fa-location-dot" />
                )}
              </div>
            </div>
            {reverseGeocoding && (
              <p className="mt-2 text-xs text-gray-500">
                <i className="fa-solid fa-location-crosshairs mr-1" /> Đang cập nhật địa chỉ theo vị trí trên bản đồ...
              </p>
            )}
            {addressError && (
              <p className="mt-2 text-xs text-amber-700">
                <i className="fa-solid fa-circle-info mr-1" /> {addressError}
              </p>
            )}
            {addressSuggestions.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-100 bg-white">
                {addressSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => selectAddressSuggestion(suggestion)}
                    className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-700 last:border-b-0 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <span className="block font-medium">{suggestion.label}</span>
                    <span className="mt-0.5 block text-xs text-gray-400">{suggestion.latitude}, {suggestion.longitude}</span>
                  </button>
                ))}
              </div>
            )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vĩ độ (Latitude)
                <span className="ml-1 text-xs font-normal text-gray-400">- dùng cho bản đồ</span>
              </label>
              <input type="number" step="any" value={form.latitude} onInput={(e) => set('latitude', e.target.value)} onChange={(e) => set('latitude', e.target.value)} required className="input-field" placeholder="10.7769" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ (Longitude)</label>
              <input type="number" step="any" value={form.longitude} onInput={(e) => set('longitude', e.target.value)} onChange={(e) => set('longitude', e.target.value)} required className="input-field" placeholder="106.7009" />
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
