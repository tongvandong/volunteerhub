import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizerVerificationApi, eventApi } from '../../services/api';
import ImageUploadField from '../../components/ui/ImageUploadField';

const fmtDateTime = (dt) => (dt ? new Date(dt).toLocaleString('vi-VN') : '');

const EMPTY_FORM = {
  organizationName: '',
  logoUrl: '',
  representativeName: '',
  contactEmail: '',
  phone: '',
  address: '',
  websiteUrl: '',
  description: '',
  documentUrl: '',
  verificationNote: '',
  commitmentAccepted: false,
};

const STATUS = {
  Unverified: { label: 'Chưa gửi hồ sơ', color: 'rgba(15,15,15,0.55)', bg: 'rgba(15,15,15,0.05)', border: 'rgba(15,15,15,0.12)' },
  PendingVerification: { label: 'Đang chờ admin duyệt', color: '#b45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.20)' },
  ChangesRequested: { label: 'Cần bổ sung thông tin', color: '#b45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.20)' },
  Rejected: { label: 'Bị từ chối', color: '#b91c1c', bg: 'rgba(185,28,28,0.07)', border: 'rgba(185,28,28,0.18)' },
  Verified: { label: 'Đã xác minh', color: '#15803d', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.20)' },
};

const LABEL_STYLE = { display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(15,15,15,0.70)', marginBottom: 4 };

const asForm = (data = {}) => ({
  organizationName: data.organizationName || '',
  logoUrl: data.logoUrl || '',
  representativeName: data.representativeName || '',
  contactEmail: data.contactEmail || '',
  phone: data.phone || '',
  address: data.address || '',
  websiteUrl: data.websiteUrl || '',
  description: data.description || '',
  documentUrl: data.documentUrl || '',
  verificationNote: data.verificationNote || '',
  commitmentAccepted: Boolean(data.commitmentAccepted),
});

export default function OrganizerVerification() {
  const [verification, setVerification] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myEvents, setMyEvents] = useState([]);
  const [originalIdentity, setOriginalIdentity] = useState({ organizationName: '', representativeName: '', documentUrl: '' });

  const statusInfo = useMemo(() => STATUS[verification?.status] || STATUS.Unverified, [verification?.status]);
  const isVerified = verification?.status === 'Verified';

  // Chỉ đổi tên tổ chức / người đại diện / tài liệu minh chứng mới phải xác minh lại.
  const identityChanged = useMemo(() => (
    (form.organizationName || '').trim() !== (originalIdentity.organizationName || '').trim() ||
    (form.representativeName || '').trim() !== (originalIdentity.representativeName || '').trim() ||
    (form.documentUrl || '') !== (originalIdentity.documentUrl || '')
  ), [form.organizationName, form.representativeName, form.documentUrl, originalIdentity]);
  const willRequireReverify = isVerified && identityChanged;

  useEffect(() => {
    organizerVerificationApi.getMine()
      .then((response) => {
        setVerification(response.data);
        setForm(asForm(response.data));
        setOriginalIdentity({
          organizationName: response.data?.organizationName || '',
          representativeName: response.data?.representativeName || '',
          documentUrl: response.data?.documentUrl || '',
        });
      })
      .catch(() => setError('Không tải được hồ sơ xác minh. Vui lòng thử lại.'))
      .finally(() => setLoading(false));

    eventApi.getMine()
      .then((response) => setMyEvents(Array.isArray(response.data) ? response.data : []))
      .catch(() => { /* silent — stats just won't show */ });
  }, []);

  const stats = useMemo(() => {
    const list = myEvents || [];
    // Chỉ tính sự kiện đã thực sự tổ chức (đã duyệt/đã hoàn thành), bỏ Pending/Rejected/Cancelled.
    const organized = list.filter((e) => ['approved', 'completed'].includes((e.status || '').toLowerCase()));
    const finished = list.filter((e) => (e.status || '').toLowerCase() === 'completed');
    // currentParticipants = số TNV đã xác nhận của mỗi sự kiện.
    const totalConfirmed = organized.reduce((sum, e) => sum + Number(e.currentParticipants || 0), 0);
    return {
      eventsCount: organized.length,
      finishedCount: finished.length,
      totalConfirmed,
    };
  }, [myEvents]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Tài liệu chỉ bắt buộc khi hồ sơ sẽ đi vào luồng duyệt (lần đầu hoặc đổi định danh),
    // không yêu cầu khi tổ chức đã verified chỉ sửa logo/mô tả/liên hệ.
    const willGoPending = !isVerified || identityChanged;
    if (willGoPending && !form.documentUrl) {
      setError('Vui lòng tải lên ảnh tài liệu minh chứng để admin có cơ sở xác minh tổ chức.');
      return;
    }

    if (willRequireReverify) {
      const ok = window.confirm(
        'Bạn đang thay đổi tên tổ chức, người đại diện hoặc tài liệu minh chứng. Hồ sơ sẽ chuyển về trạng thái chờ admin duyệt lại và bạn tạm thời không thể tạo sự kiện mới. Bạn muốn tiếp tục?'
      );
      if (!ok) return;
    }

    setSaving(true);

    try {
      const response = await organizerVerificationApi.submit(form);
      setVerification(response.data);
      setForm(asForm(response.data));
      setOriginalIdentity({
        organizationName: response.data?.organizationName || '',
        representativeName: response.data?.representativeName || '',
        documentUrl: response.data?.documentUrl || '',
      });
      setSuccess(
        response.data?.status === 'Verified'
          ? 'Đã cập nhật thông tin tổ chức. Hồ sơ vẫn ở trạng thái đã xác minh.'
          : 'Đã gửi hồ sơ xác minh. Trong thời gian chờ admin duyệt lại, bạn chưa thể tạo sự kiện mới.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi hồ sơ xác minh thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '4px solid rgba(27,97,201,0.20)', borderTopColor: '#1b61c9' }} />
      </div>
    );
  }

  const displayName = form.organizationName || verification?.organizationName || 'Tổ chức của bạn';
  const hasMiniStats = stats.eventsCount > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--c-ink)', margin: 0 }}>Hồ sơ tổ chức</h1>
          <p style={{ fontSize: 13, color: 'rgba(15,15,15,0.50)', marginTop: 4 }}>
            Thông tin tổ chức + xác minh với admin để được tạo sự kiện.
          </p>
        </div>
        <span
          className="inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-semibold"
          style={{ color: statusInfo.color, background: statusInfo.bg, border: `1px solid ${statusInfo.border}` }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Hero card with logo + name + mini-stats */}
      <div className="rounded-lg overflow-hidden bg-white" style={{ border: '1px solid rgba(15,15,15,0.08)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #4d84e8 0%, #1b61c9 100%)' }} />
        <div className="p-5">
          <div className="flex items-start gap-4">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo"
                className="w-16 h-16 rounded-lg object-contain flex-shrink-0 bg-white"
                style={{ border: '1px solid rgba(15,15,15,0.10)' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
                style={{ background: '#1b61c9' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-semibold truncate" style={{ color: 'var(--c-ink)' }}>
                {displayName}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(15,15,15,0.50)' }}>
                {form.representativeName ? `Đại diện · ${form.representativeName}` : 'Tổ chức tình nguyện'}
              </p>
              {form.description && (
                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'rgba(15,15,15,0.65)' }}>{form.description}</p>
              )}
            </div>
          </div>
        </div>

        {hasMiniStats && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              borderTop: '1px solid rgba(15,15,15,0.06)',
            }}
          >
            <div className="py-4 text-center" style={{ borderRight: '1px solid rgba(15,15,15,0.06)' }}>
              <i className="fa-solid fa-calendar-check text-[13px] mb-1.5 block" style={{ color: '#1b61c9' }} />
              <p className="text-[20px] font-bold leading-none" style={{ color: 'var(--c-ink)' }}>{stats.eventsCount}</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(15,15,15,0.40)' }}>Sự kiện đã tổ chức</p>
            </div>
            <div className="py-4 text-center" style={{ borderRight: '1px solid rgba(15,15,15,0.06)' }}>
              <i className="fa-solid fa-flag-checkered text-[13px] mb-1.5 block" style={{ color: '#15803d' }} />
              <p className="text-[20px] font-bold leading-none" style={{ color: 'var(--c-ink)' }}>{stats.finishedCount}</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(15,15,15,0.40)' }}>Đã hoàn thành</p>
            </div>
            <div className="py-4 text-center">
              <i className="fa-solid fa-people-group text-[13px] mb-1.5 block" style={{ color: '#b45309' }} />
              <p className="text-[20px] font-bold leading-none" style={{ color: 'var(--c-ink)' }}>{stats.totalConfirmed}</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(15,15,15,0.40)' }}>Lượt TNV đã nhận</p>
            </div>
          </div>
        )}
      </div>

      {verification && (verification.submittedAt || verification.verifiedAt) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs" style={{ color: 'rgba(15,15,15,0.45)' }}>
          {verification.submittedAt && (
            <span><i className="fa-regular fa-paper-plane mr-1" />Gửi: {fmtDateTime(verification.submittedAt)}</span>
          )}
          {isVerified && verification.verifiedAt && (
            <span>
              <i className="fa-solid fa-circle-check mr-1" style={{ color: '#15803d' }} />
              Duyệt: {fmtDateTime(verification.verifiedAt)}{verification.verifierName ? ` · ${verification.verifierName}` : ''}
            </span>
          )}
        </div>
      )}

      {verification?.adminNote &&
        (verification.status === 'ChangesRequested' || verification.status === 'Rejected') && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(180,83,9,0.20)', color: '#b45309' }}>
          <p className="font-semibold">Phản hồi từ admin</p>
          <p className="mt-1">{verification.adminNote}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.18)', color: '#b91c1c' }}>
          <i className="fa-solid fa-circle-exclamation mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.20)', color: '#15803d' }}>
          <i className="fa-solid fa-circle-check mr-2" />
          {success}
        </div>
      )}

      {isVerified && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.20)', color: '#15803d' }}>
          Hồ sơ đã được xác minh. Bạn có thể tạo sự kiện mới và gửi lên admin duyệt nội dung sự kiện.
          <Link to="/events/create" className="ml-2 font-semibold underline" style={{ color: '#15803d' }}>
            Tạo sự kiện
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div>
          <ImageUploadField
            label="Logo tổ chức"
            value={form.logoUrl}
            onChange={(url) => set('logoUrl', url)}
            helper="Logo hiển thị trên trang sự kiện và danh sách tổ chức. Nên dùng ảnh nền trong hoặc nền trắng để không bị cắt."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={LABEL_STYLE}>Tên tổ chức *</label>
            <input
              className="input-field"
              value={form.organizationName}
              onChange={(e) => set('organizationName', e.target.value)}
              required
              placeholder="VD: CLB Tình nguyện MTA"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Người đại diện *</label>
            <input
              className="input-field"
              value={form.representativeName}
              onChange={(e) => set('representativeName', e.target.value)}
              required
              placeholder="Họ tên người chịu trách nhiệm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={LABEL_STYLE}>Email liên hệ *</label>
            <input
              type="email"
              className="input-field"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
              required
              placeholder="contact@example.org"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Số điện thoại</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Số liên hệ khi cần xác minh"
            />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Địa chỉ hoạt động</label>
          <input
            className="input-field"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Địa chỉ hoặc khu vực tổ chức thường hoạt động"
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Website / trang giới thiệu</label>
          <input
            type="url"
            className="input-field"
            value={form.websiteUrl}
            onChange={(e) => set('websiteUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <ImageUploadField
            label="Ảnh tài liệu minh chứng *"
            value={form.documentUrl}
            onChange={(url) => set('documentUrl', url)}
            helper="Bắt buộc. Tải lên ảnh quyết định thành lập, giấy phép hoạt động hoặc thư uỷ quyền (JPG/PNG)."
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Mô tả tổ chức *</label>
          <textarea
            rows={4}
            className="input-field resize-none"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            required
            placeholder="Lĩnh vực hoạt động, kinh nghiệm tổ chức, đối tượng phục vụ..."
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Ghi chú gửi admin</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            value={form.verificationNote}
            onChange={(e) => set('verificationNote', e.target.value)}
            placeholder="Thông tin bổ sung giúp admin kiểm tra nhanh hơn"
          />
        </div>

        <label className="flex items-start gap-3 rounded-lg p-3 text-sm" style={{ background: 'rgba(15,15,15,0.03)', border: '1px solid rgba(15,15,15,0.08)', color: 'rgba(15,15,15,0.70)' }}>
          <input
            type="checkbox"
            className="mt-1"
            checked={form.commitmentAccepted}
            onChange={(e) => set('commitmentAccepted', e.target.checked)}
            required
          />
          <span>
            Tôi cam kết thông tin tổ chức là đúng và chịu trách nhiệm với các sự kiện được đăng trên VolunteerHub.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          {willRequireReverify && (
            <p className="text-xs sm:text-right" style={{ color: 'rgba(15,15,15,0.50)' }}>
              <i className="fa-solid fa-circle-info mr-1" style={{ color: 'rgba(15,15,15,0.35)' }} />
              Đổi tên tổ chức, người đại diện hoặc tài liệu sẽ chuyển về <strong>chờ admin duyệt</strong> và tạm dừng tạo sự kiện.
            </p>
          )}
          {isVerified && !willRequireReverify && (
            <p className="text-xs sm:text-right" style={{ color: 'rgba(15,15,15,0.50)' }}>
              <i className="fa-solid fa-circle-check mr-1" style={{ color: '#15803d' }} />
              Cập nhật logo, mô tả hoặc thông tin liên hệ vẫn giữ nguyên trạng thái đã xác minh.
            </p>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 flex-shrink-0">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <i className="fa-solid fa-paper-plane" />
            {willRequireReverify ? 'Gửi chỉnh sửa để duyệt lại' : isVerified ? 'Lưu thay đổi' : 'Gửi hồ sơ xác minh'}
          </button>
        </div>
      </form>
    </div>
  );
}
