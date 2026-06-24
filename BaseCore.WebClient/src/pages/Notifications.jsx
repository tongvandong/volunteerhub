import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { fmt, parseApiDate } from '../utils/format';

const TYPE_ICON = {
  EventApproved:          { icon: 'fa-calendar-check', color: 'bg-green-100 text-green-600' },
  EventRejected:          { icon: 'fa-circle-xmark', color: 'bg-red-100 text-red-600' },
  EventAutoCompleted:     { icon: 'fa-flag-checkered', color: 'bg-green-100 text-green-600' },
  EventChange:            { icon: 'fa-pen', color: 'bg-yellow-100 text-yellow-600' },
  EventUpdated:           { icon: 'fa-pen', color: 'bg-yellow-100 text-yellow-600' },
  EventReverted:          { icon: 'fa-rotate-left', color: 'bg-yellow-100 text-yellow-600' },
  EventCancelled:         { icon: 'fa-ban', color: 'bg-red-100 text-red-600' },
  EventTransferred:       { icon: 'fa-right-left', color: 'bg-blue-100 text-blue-600' },
  EventUncompleted:       { icon: 'fa-rotate-left', color: 'bg-surface-2 text-warmink-2' },
  RegistrationConfirmed:  { icon: 'fa-clipboard-check', color: 'bg-blue-100 text-blue-600' },
  RegistrationCancelled:  { icon: 'fa-circle-xmark', color: 'bg-surface-2 text-warmink-2' },
  RegistrationWithdrawn:  { icon: 'fa-circle-xmark', color: 'bg-surface-2 text-warmink-2' },
  RegistrationCancelRequested: { icon: 'fa-hourglass-half', color: 'bg-yellow-100 text-yellow-600' },
  RegistrationCheckIn:    { icon: 'fa-user-check', color: 'bg-blue-100 text-blue-600' },
  RegistrationCheckOut:   { icon: 'fa-clock', color: 'bg-blue-100 text-blue-600' },
  RegistrationManualAttend: { icon: 'fa-user-check', color: 'bg-blue-100 text-blue-600' },
  RegistrationWalkIn:     { icon: 'fa-person-walking', color: 'bg-blue-100 text-blue-600' },
  RegistrationHoursAdjusted: { icon: 'fa-clock', color: 'bg-blue-100 text-blue-600' },
  RegistrationClosedOnEventComplete: { icon: 'fa-flag-checkered', color: 'bg-surface-2 text-warmink-2' },
  EventReminder:          { icon: 'fa-bell', color: 'bg-yellow-100 text-yellow-600' },
  NewPost:                { icon: 'fa-comment', color: 'bg-purple-100 text-purple-600' },
  CertificateIssued:      { icon: 'fa-certificate', color: 'bg-primary-100 text-primary-600' },
  BadgeAwarded:           { icon: 'fa-medal', color: 'bg-yellow-100 text-yellow-500' },
  InterviewScheduled:     { icon: 'fa-video', color: 'bg-blue-100 text-blue-600' },
  InterviewUpdated:       { icon: 'fa-pen', color: 'bg-blue-100 text-blue-600' },
  InterviewCancelled:     { icon: 'fa-circle-xmark', color: 'bg-surface-2 text-warmink-2' },
  InterviewPassed:        { icon: 'fa-circle-check', color: 'bg-green-100 text-green-600' },
  InterviewFailed:        { icon: 'fa-circle-xmark', color: 'bg-red-100 text-red-600' },
  DonationPending:        { icon: 'fa-hand-holding-heart', color: 'bg-yellow-100 text-yellow-600' },
  DonationConfirmed:      { icon: 'fa-hand-holding-heart', color: 'bg-green-100 text-green-600' },
  DonationRejected:       { icon: 'fa-circle-xmark', color: 'bg-red-100 text-red-600' },
  DonationCancelled:      { icon: 'fa-circle-xmark', color: 'bg-surface-2 text-warmink-2' },
  CampaignReminder:       { icon: 'fa-triangle-exclamation', color: 'bg-yellow-100 text-yellow-600' },
  CampaignAutoClosed:     { icon: 'fa-lock', color: 'bg-surface-2 text-warmink-2' },
  CampaignClosed:         { icon: 'fa-lock', color: 'bg-surface-2 text-warmink-2' },
  // Xác minh tổ chức
  OrganizerVerificationApproved:        { icon: 'fa-building-shield', color: 'bg-green-100 text-green-600' },
  OrganizerVerificationChangesRequested:{ icon: 'fa-pen', color: 'bg-yellow-100 text-yellow-600' },
  OrganizerVerificationRejected:        { icon: 'fa-circle-xmark', color: 'bg-red-100 text-red-600' },
  // Tài trợ
  SponsorshipProposalCreated:   { icon: 'fa-handshake', color: 'bg-blue-100 text-blue-600' },
  SponsorshipReceived:          { icon: 'fa-sack-dollar', color: 'bg-green-100 text-green-600' },
  SponsorshipProposalReported:  { icon: 'fa-file-invoice-dollar', color: 'bg-blue-100 text-blue-600' },
  SponsorshipProposalCancelled: { icon: 'fa-circle-xmark', color: 'bg-surface-2 text-warmink-2' },
  SponsorshipProposalAccepted:  { icon: 'fa-circle-check', color: 'bg-green-100 text-green-600' },
  SponsorshipProposalRejected:  { icon: 'fa-circle-xmark', color: 'bg-red-100 text-red-600' },
  SponsorshipProposalReverted:  { icon: 'fa-rotate-left', color: 'bg-yellow-100 text-yellow-600' },
  SponsorOffer:                 { icon: 'fa-handshake', color: 'bg-blue-100 text-blue-600' },
};

/** Trả về URL mà thông báo nên dẫn đến khi bấm vào (theo loại + role). */
function getNotificationLink(n, role) {
  const id = n.relatedId;
  switch (n.type) {
    case 'BadgeAwarded':
      return '/achievements';
    case 'CertificateIssued':
      return '/achievements?tab=certificates';
    case 'NewPost':
      return id ? `/channels/${id}` : null;

    // Xác minh tổ chức — luôn dẫn về trang hồ sơ tổ chức (relatedId là id hồ sơ, không phải sự kiện)
    case 'OrganizerVerificationApproved':
    case 'OrganizerVerificationChangesRequested':
    case 'OrganizerVerificationRejected':
      return '/organizer/verification';

    // Tài trợ — relatedId nay là eventId. Organizer/Admin mở thẳng tab "Tài trợ doanh nghiệp"
    // trong trang quản lý sự kiện; Sponsor xem danh sách tài trợ của mình.
    case 'SponsorshipProposalCreated':
    case 'SponsorshipReceived':
    case 'SponsorshipProposalReported':
    case 'SponsorshipProposalReverted':
    case 'SponsorshipProposalAccepted':
    case 'SponsorshipProposalRejected':
    case 'SponsorshipProposalCancelled':
    case 'SponsorOffer':
      if (role === 'Organizer' || role === 'Admin') return id ? `/events/${id}/manage?tab=corporate` : '/my-events';
      return '/my-sponsorships';

    // Phỏng vấn — TNV vào trang Hoạt động xem chi tiết; Organizer vào trang quản lý sự kiện
    case 'InterviewScheduled':
    case 'InterviewUpdated':
    case 'InterviewCancelled':
    case 'InterviewPassed':
    case 'InterviewFailed':
      if (role === 'Organizer' || role === 'Admin') return id ? `/events/${id}/manage` : null;
      return '/activity';

    // Đợt kêu gọi (relatedId = eventId) — Organizer vào tab Kêu gọi ủng hộ trong quản lý sự kiện
    case 'DonationPending':
    case 'CampaignReminder':
    case 'CampaignAutoClosed':
    case 'CampaignClosed':
      if (role === 'Organizer' || role === 'Admin') return id ? `/events/${id}/manage?tab=campaigns` : null;
      return '/activity?tab=donations';

    // Trạng thái khoản ủng hộ (relatedId = campaignId, không deep-link manage được)
    case 'DonationConfirmed':
    case 'DonationRejected':
    case 'DonationCancelled':
      if (role === 'Organizer' || role === 'Admin') return '/my-events';
      return '/activity?tab=donations';

    // Đăng ký — Organizer xem trong quản lý; TNV xem trong Hoạt động hoặc chi tiết sự kiện
    case 'RegistrationConfirmed':
    case 'RegistrationCancelled':
    case 'RegistrationCancelRequested':
    case 'RegistrationWithdrawn':
    case 'RegistrationCheckIn':
    case 'RegistrationCheckOut':
    case 'RegistrationManualAttend':
    case 'RegistrationWalkIn':
    case 'RegistrationHoursAdjusted':
    case 'RegistrationClosedOnEventComplete':
      if (role === 'Organizer' || role === 'Admin') return id ? `/events/${id}/manage` : null;
      return '/activity';

    // Sự kiện — Organizer xem trong quản lý; mọi vai trò khác xem trang công khai
    case 'EventApproved':
    case 'EventRejected':
    case 'EventReverted':
    case 'EventChange':
    case 'EventUpdated':
    case 'EventAutoCompleted':
    case 'EventCancelled':
    case 'EventTransferred':
    case 'EventUncompleted':
    case 'EventReminder':
      if (role === 'Organizer' || role === 'Admin') return id ? `/events/${id}/manage` : (id ? `/events/${id}` : null);
      return id ? `/events/${id}` : null;

    default:
      return id ? `/events/${id}` : null;
  }
}

function timeAgo(dt) {
  const d = parseApiDate(dt);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 0) return 'Vừa xong';
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return fmt(d);
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // notification đang mở trong modal
  const PAGE_SIZE = 15;

  const load = (p = 1) => {
    setLoading(true);
    notificationApi.getAll({ page: p, pageSize: PAGE_SIZE })
      .then(r => { setItems(r.data.items || []); setTotalCount(r.data.totalCount || 0); })
      .catch((err) => console.error('[Notifications] load failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const emitChanged = () => {
    try { window.dispatchEvent(new CustomEvent('volunteerhub:notifications-updated')); } catch { /* noop */ }
  };

  const markRead = async (id) => {
    await notificationApi.markRead(id).catch((err) => console.error('[Notifications] markRead failed:', err));
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    emitChanged();
  };

  const markAll = async () => {
    await notificationApi.markAllRead().catch((err) => console.error('[Notifications] markAllRead failed:', err));
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    emitChanged();
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-warmink">Thông báo</h1>
          {unreadCount > 0 && <p className="text-sm text-warmink-2">{unreadCount} chưa đọc</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} className="btn-secondary btn-sm flex items-center gap-2">
            <i className="fa-solid fa-check-double" /> Đọc tất cả
          </button>
        )}
      </div>

      {/* List */}
      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-bell-slash text-4xl text-warmink-3 mb-3 block" />
          <p className="text-warmink-2">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => {
            const t = TYPE_ICON[n.type] || { icon: 'fa-bell', color: 'bg-surface-2 text-warmink-2' };
            const openDetail = async () => {
              if (!n.isRead) await markRead(n.id);
              setDetail(n);
            };
            return (
              <div
                key={n.id}
                onClick={openDetail}
                className={`card p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow ${!n.isRead ? 'border-primary-200 bg-primary-50/30' : ''}`}
                style={{ minHeight: 88 }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.color}`}>
                  <i className={`fa-solid ${t.icon} text-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium line-clamp-1 ${!n.isRead ? 'text-warmink' : 'text-warmink-2'}`}>{n.title}</p>
                  <p className="text-xs text-warmink-2 mt-0.5 line-clamp-2 break-words">{n.message}</p>
                  <p className="text-xs text-warmink-3 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={Math.ceil(totalCount / PAGE_SIZE)}
        onPageChange={setPage}
      />

      {/* Detail modal — hiện toàn bộ nội dung + nút đi tới trang liên quan */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title || 'Thông báo'}
        size="md"
      >
        {detail && (() => {
          const link = getNotificationLink(detail, user?.role);
          const t = TYPE_ICON[detail.type] || { icon: 'fa-bell', color: 'bg-surface-2 text-warmink-2' };
          return (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.color}`}>
                  <i className={`fa-solid ${t.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs" style={{ color: 'rgba(15,15,15,0.45)' }}>{timeAgo(detail.createdAt)}</p>
                  <p className="text-sm mt-2 whitespace-pre-line break-words" style={{ color: 'var(--c-ink)' }}>
                    {detail.message}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid rgba(15,15,15,0.06)' }}>
                <button type="button" onClick={() => setDetail(null)} className="btn-secondary">Đóng</button>
                {link && (
                  <button
                    type="button"
                    onClick={() => { const to = link; setDetail(null); navigate(to); }}
                    className="btn-primary flex items-center gap-2"
                  >
                    Đi tới trang liên quan <i className="fa-solid fa-arrow-right text-[11px]" />
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
