import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ImageLightbox from '../../components/ui/ImageLightbox';
import Modal from '../../components/ui/Modal';

const STATUS = {
  PendingVerification: { label: 'Chờ xác minh', className: 'bg-amber-100 text-amber-700' },
  ChangesRequested: { label: 'Cần bổ sung', className: 'bg-orange-100 text-orange-700' },
  Verified: { label: 'Đã xác minh', className: 'bg-emerald-100 text-emerald-700' },
  Rejected: { label: 'Bị từ chối', className: 'bg-red-100 text-red-700' },
  SelfDeclared: { label: 'Tự khai', className: 'bg-surface-2 text-warmink-2' },
  Unverified: { label: 'Chưa xác minh', className: 'bg-surface-2 text-warmink-2' },
};

const REVIEW = {
  approve: {
    title: 'Duyệt xác minh',
    label: 'Ghi chú admin',
    placeholder: 'VD: Minh chứng hợp lệ.',
    defaultNote: '',
    button: 'Duyệt',
    className: 'btn-primary',
  },
  requestChanges: {
    title: 'Yêu cầu bổ sung',
    label: 'Nội dung cần bổ sung',
    placeholder: 'VD: Ảnh bị mờ, vui lòng upload lại ảnh rõ thông tin hơn.',
    defaultNote: '',
    button: 'Gửi yêu cầu',
    className: 'btn-secondary',
  },
  reject: {
    title: 'Từ chối xác minh',
    label: 'Lý do từ chối',
    placeholder: 'VD: Minh chứng không trùng với thông tin hồ sơ.',
    defaultNote: '',
    button: 'Từ chối',
    className: 'btn-danger',
  },
};

function Pill({ value }) {
  const status = STATUS[value] || STATUS.PendingVerification;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>;
}

function EvidenceLink({ href, label }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
      <i className="fa-solid fa-arrow-up-right-from-square" />
      {label}
    </a>
  );
}

export default function AdminVolunteerVerifications({ embedded = false }) {
  const [tab, setTab] = useState('kyc');
  const [status, setStatus] = useState('PendingVerification');
  const [kycItems, setKycItems] = useState([]);
  const [skillItems, setSkillItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');
  const [msg, setMsg] = useState('');
  const [review, setReview] = useState(null);
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      if (tab === 'kyc') {
        const res = await adminApi.getVolunteerKycRequests({ status });
        setKycItems(res.data || []);
      } else {
        const res = await adminApi.getVolunteerSkillVerifications({ status });
        setSkillItems(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, status]);

  const openReview = (item, action, type) => {
    setMsg('');
    setReview({ item, action, type });
    setNote(REVIEW[action].defaultNote);
  };

  const closeReview = () => {
    if (!actingId) {
      setReview(null);
      setNote('');
    }
  };

  const submitReview = async () => {
    if (!review) return;
    const trimmed = note.trim();
    if (review.action !== 'approve' && trimmed.length < 10) {
      alert('Vui lòng nhập lý do tối thiểu 10 ký tự.');
      return;
    }

    const actionId = `${review.type}-${review.item.id}`;
    setActingId(actionId);
    try {
      if (review.type === 'kyc') {
        if (review.action === 'approve') await adminApi.approveVolunteerKyc(review.item.id, { note: trimmed });
        if (review.action === 'requestChanges') await adminApi.requestVolunteerKycChanges(review.item.id, { note: trimmed });
        if (review.action === 'reject') await adminApi.rejectVolunteerKyc(review.item.id, { note: trimmed });
        setMsg('Đã cập nhật hồ sơ KYC.');
      } else {
        if (review.action === 'approve') await adminApi.approveVolunteerSkill(review.item.id, { note: trimmed });
        if (review.action === 'requestChanges') await adminApi.requestVolunteerSkillChanges(review.item.id, { note: trimmed });
        if (review.action === 'reject') await adminApi.rejectVolunteerSkill(review.item.id, { note: trimmed });
        setMsg('Đã cập nhật xác minh kỹ năng.');
      }
      closeReview();
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Thao tác xác minh thất bại.');
    } finally {
      setActingId('');
    }
  };

  const items = tab === 'kyc' ? kycItems : skillItems;
  const reviewCopy = review ? REVIEW[review.action] : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {embedded ? <span /> : (
          <div>
            <h1 className="text-xl font-bold text-warmink">Duyệt volunteer</h1>
            <p className="mt-1 text-sm text-warmink-2">Xác minh danh tính KYC và minh chứng kỹ năng/ngôn ngữ.</p>
          </div>
        )}
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-full sm:w-56">
          <option value="PendingVerification">Chờ xác minh</option>
          <option value="ChangesRequested">Cần bổ sung</option>
          <option value="Verified">Đã xác minh</option>
          <option value="Rejected">Bị từ chối</option>
          <option value="">Tất cả</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setTab('kyc')} className={`btn-sm ${tab === 'kyc' ? 'btn-primary' : 'btn-secondary'}`}>
          <i className="fa-solid fa-id-card mr-1" /> KYC
        </button>
        <button type="button" onClick={() => setTab('skills')} className={`btn-sm ${tab === 'skills' ? 'btn-primary' : 'btn-secondary'}`}>
          <i className="fa-solid fa-star mr-1" /> Kỹ năng
        </button>
      </div>

      {msg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-warmink-2">Không có hồ sơ nào trong trạng thái này.</div>
      ) : tab === 'kyc' ? (
        <div className="space-y-3">
          {kycItems.map((item) => (
            <div key={item.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-warmink">{item.volunteerName || `Volunteer #${item.userId}`}</p>
                    <Pill value={item.kycStatus} />
                  </div>
                  <p className="mt-1 text-sm text-warmink-2">{item.volunteerEmail}</p>
                  <a href={`/profile/${item.userId}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary-600 hover:underline">
                    <i className="fa-solid fa-user mr-1" />Xem hồ sơ volunteer
                  </a>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <ImageLightbox src={item.identityFrontImageUrl} alt="CCCD mặt trước" label="CCCD trước" className="h-16 w-24" />
                    <ImageLightbox src={item.identityBackImageUrl} alt="CCCD mặt sau" label="CCCD sau" className="h-16 w-24" />
                    <ImageLightbox src={item.portraitImageUrl} alt="Ảnh chân dung" label="Chân dung" className="h-20 w-16" />
                  </div>
                  {item.kycAdminNote && <p className="mt-3 text-sm text-warmink-2">Ghi chú: {item.kycAdminNote}</p>}
                </div>
                {item.kycStatus === 'PendingVerification' && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" disabled={actingId === `kyc-${item.id}`} onClick={() => openReview(item, 'approve', 'kyc')} className="btn-primary btn-sm">Duyệt</button>
                    <button type="button" disabled={actingId === `kyc-${item.id}`} onClick={() => openReview(item, 'requestChanges', 'kyc')} className="btn-secondary btn-sm">Yêu cầu bổ sung</button>
                    <button type="button" disabled={actingId === `kyc-${item.id}`} onClick={() => openReview(item, 'reject', 'kyc')} className="btn-danger btn-sm">Từ chối</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {skillItems.map((item) => (
            <div key={item.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-warmink">{item.skillName}</p>
                    <Pill value={item.verificationStatus} />
                  </div>
                  <p className="mt-1 text-sm text-warmink-2">
                    {item.volunteerName || `Volunteer #${item.userId}`} · {item.volunteerEmail} · {item.level}
                  </p>
                  {item.verificationNote && <p className="mt-2 text-sm text-warmink-2">{item.verificationNote}</p>}
                  <div className="mt-3">
                    <EvidenceLink href={item.evidenceUrl} label="Mở minh chứng" />
                  </div>
                  {item.adminNote && <p className="mt-3 text-sm text-warmink-2">Ghi chú: {item.adminNote}</p>}
                </div>
                {item.verificationStatus === 'PendingVerification' && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" disabled={actingId === `skill-${item.id}`} onClick={() => openReview(item, 'approve', 'skill')} className="btn-primary btn-sm">Duyệt</button>
                    <button type="button" disabled={actingId === `skill-${item.id}`} onClick={() => openReview(item, 'requestChanges', 'skill')} className="btn-secondary btn-sm">Yêu cầu bổ sung</button>
                    <button type="button" disabled={actingId === `skill-${item.id}`} onClick={() => openReview(item, 'reject', 'skill')} className="btn-danger btn-sm">Từ chối</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!review} onClose={closeReview} title={reviewCopy?.title || ''} size="md">
        {review && (
          <div className="space-y-4">
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3 text-sm text-warmink-2">
              <p className="font-semibold text-warmink">
                {review.type === 'kyc'
                  ? (review.item.volunteerName || `Volunteer #${review.item.userId}`)
                  : `${review.item.skillName} · ${review.item.volunteerName || `Volunteer #${review.item.userId}`}`}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-warmink-2">{reviewCopy.label}</label>
              <textarea
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="input-field resize-none"
                placeholder={reviewCopy.placeholder}
              />
              {review.action !== 'approve' && <p className="mt-1 text-xs text-warmink-3">Nội dung này sẽ gửi cho volunteer để họ biết cần bổ sung/sửa gì.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeReview} className="btn-secondary">Hủy</button>
              <button type="button" onClick={submitReview} disabled={!!actingId} className={`${reviewCopy.className} flex items-center gap-2`}>
                {actingId && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {reviewCopy.button}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
