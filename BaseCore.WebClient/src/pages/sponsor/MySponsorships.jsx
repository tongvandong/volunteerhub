import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventApi, sponsorshipProposalApi } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import ImageUploadField from '../../components/ui/ImageUploadField';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import StatusBadge from '../../components/ui/StatusBadge';
import { fmtDateTime, money } from '../../utils/format';

const EMPTY_FORM = {
  eventId: '',
  title: '',
  message: '',
  offeredAmount: '',
  purpose: '',
  publicSponsorName: '',
  publicMessage: '',
  logoUrl: '',
  attachmentUrl: '',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ phản hồi' },
  { key: 'accepted', label: 'Đã chấp nhận' },
  { key: 'received', label: 'Đã ghi nhận' },
  { key: 'closed', label: 'Từ chối / đã hủy' },
];

const PROPOSAL_STATUS_META = {
  Pending: { label: 'Chờ phản hồi', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  Accepted: { label: 'Đã chấp nhận', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  Received: { label: 'Đã ghi nhận', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  Reported: { label: 'Đã báo cáo', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  Rejected: { label: 'Đã từ chối', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  Cancelled: { label: 'Đã hủy', className: 'border-warmborder bg-surface-2 text-warmink-2' },
};

const TYPE_LABEL = {
  SponsorOffer: 'Bạn đề nghị tài trợ',
  OrganizerRequest: 'Nhà tổ chức mời tài trợ',
};

function getProposalAmount(proposal) {
  return Number(
    proposal.actualReceivedAmount
      ?? proposal.amount
      ?? proposal.offeredAmount
      ?? proposal.requestedAmount
      ?? 0,
  ) || 0;
}

function proposalGroup(status) {
  if (status === 'Pending') return 'pending';
  if (status === 'Accepted') return 'accepted';
  if (status === 'Received' || status === 'Reported') return 'received';
  if (status === 'Rejected' || status === 'Cancelled') return 'closed';
  return 'all';
}

function ProposalStatusBadge({ status }) {
  const meta = PROPOSAL_STATUS_META[status] || {
    label: status || 'Không rõ',
    className: 'border-warmborder bg-white text-warmink-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function SponsorSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="hidden h-10 w-40 sm:block" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
      </div>
      <div className="card space-y-3 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export default function MySponsorships() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerModal, setOfferModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState(() => {
    const f = searchParams.get('filter');
    return FILTER_TABS.some((t) => t.key === f) ? f : 'all';
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const selectedEvent = useMemo(
    () => events.find((ev) => String(ev.id) === String(form.eventId)),
    [events, form.eventId],
  );

  const summary = useMemo(() => {
    const received = proposals.filter((p) => p.status === 'Received' || p.status === 'Reported');
    return {
      totalReceived: received.reduce((sum, p) => sum + getProposalAmount(p), 0),
      pending: proposals.filter((p) => p.status === 'Pending').length,
      accepted: proposals.filter((p) => p.status === 'Accepted').length,
      completed: received.length,
    };
  }, [proposals]);

  const filteredProposals = useMemo(
    () => proposals.filter((p) => filter === 'all' || proposalGroup(p.status) === filter),
    [filter, proposals],
  );

  const load = async () => {
    const [proposalRes, approvedEventRes, completedEventRes] = await Promise.all([
      sponsorshipProposalApi.getMy(),
      eventApi.getAll({ status: 'Approved', pageSize: 100 }),
      eventApi.getAll({ status: 'Completed', pageSize: 100 }),
    ]);
    setProposals(Array.isArray(proposalRes.data) ? proposalRes.data : []);
    setEvents([...(approvedEventRes.data?.items || []), ...(completedEventRes.data?.items || [])]);
  };

  useEffect(() => {
    let alive = true;
    load()
      .catch(() => {
        if (alive) setActionError('Không thể tải dữ liệu tài trợ. Vui lòng thử lại sau.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (!eventId || loading) return;

    // Nếu sự kiện deep-link không nằm trong danh sách đã tải (ngoài top-100), tải bổ sung để preview/select hiện đúng.
    if (!events.some((ev) => String(ev.id) === String(eventId))) {
      eventApi.getById(eventId)
        .then((r) => { if (r?.data) setEvents((prev) => [r.data, ...prev]); })
        .catch(() => {});
    }
    setForm((current) => ({ ...current, eventId }));
    setOfferModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete('eventId');
    setSearchParams(next, { replace: true });
  }, [loading, searchParams, setSearchParams, events]);

  const openOffer = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setOfferModal(true);
  };

  const closeOffer = () => {
    if (saving) return;
    setOfferModal(false);
    setFormError('');
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    const offeredAmount = Number(form.offeredAmount);
    const title = form.title.trim();
    const message = form.message.trim();

    if (!form.eventId) {
      setFormError('Vui lòng chọn sự kiện muốn tài trợ.');
      return;
    }
    if (!Number.isFinite(offeredAmount) || offeredAmount <= 0) {
      setFormError('Số tiền tài trợ phải lớn hơn 0.');
      return;
    }
    if (title.length < 3) {
      setFormError('Tiêu đề tài trợ cần có ít nhất 3 ký tự.');
      return;
    }
    if (!message) {
      setFormError('Vui lòng nhập nội dung đề nghị tài trợ.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await sponsorshipProposalApi.sponsorOffer(form.eventId, {
        ...form,
        title,
        message,
        offeredAmount,
      });
      await load();
      setOfferModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gửi đề nghị tài trợ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const respond = async (proposal, action) => {
    if (action === 'accept' && !window.confirm(`Chấp nhận lời mời tài trợ "${proposal.title}"? Nhà tổ chức sẽ được thông báo để phối hợp tiếp nhận.`)) return;
    if (action === 'cancel' && !window.confirm(`Hủy đề nghị tài trợ "${proposal.title}"? Hành động này không thể hoàn tác.`)) return;
    setActionError('');
    try {
      if (action === 'accept') {
        await sponsorshipProposalApi.accept(proposal.id, { responseMessage: 'Nhà tài trợ đã chấp nhận lời mời.' });
      }
      if (action === 'cancel') {
        await sponsorshipProposalApi.cancel(proposal.id);
      }
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Cập nhật đề nghị tài trợ thất bại.');
    }
  };

  const openRejectModal = (proposal) => {
    setRejectTarget(proposal);
    setRejectReason('');
    setFormError('');
    setRejectModal(true);
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 10) {
      setFormError('Lý do từ chối phải có ít nhất 10 ký tự.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await sponsorshipProposalApi.reject(rejectTarget.id, { responseMessage: rejectReason.trim() });
      setRejectModal(false);
      setRejectTarget(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Từ chối đề nghị thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SponsorSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <i className="fa-solid fa-handshake" />
            Không gian nhà tài trợ
          </p>
          <h1 className="text-2xl font-bold text-warmink">Tài trợ của tôi</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-warmink-2">
            Theo dõi các đề nghị tài trợ, phản hồi của nhà tổ chức và số tiền đã được ghi nhận.
          </p>
        </div>
        <button type="button" onClick={openOffer} className="btn-primary flex items-center gap-2 self-start">
          <i className="fa-solid fa-circle-plus" />
          Đề nghị tài trợ
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon="fa-sack-dollar" label="Tổng đã ghi nhận" value={money(summary.totalReceived)} tone="emerald" />
        <SummaryCard icon="fa-clock" label="Đang chờ phản hồi" value={summary.pending} tone="amber" />
        <SummaryCard icon="fa-circle-check" label="Đã chấp nhận" value={summary.accepted} tone="blue" />
        <SummaryCard icon="fa-file-circle-check" label="Đã nhận / báo cáo" value={summary.completed} tone="indigo" />
      </section>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-warmborder bg-white text-warmink-2 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {filteredProposals.length === 0 ? (
          <EmptyState
            icon="fa-handshake"
            title={filter === 'all' ? 'Chưa có đề nghị tài trợ nào' : 'Không có đề nghị nào trong mục này'}
            description={
              filter === 'all'
                ? 'Bạn có thể chủ động gửi đề nghị tài trợ cho sự kiện phù hợp với định hướng của đơn vị.'
                : 'Thử đổi bộ lọc hoặc gửi một đề nghị tài trợ mới.'
            }
            cta={filter === 'all' ? 'Gửi đề nghị đầu tiên' : 'Đề nghị tài trợ'}
            onCta={openOffer}
          />
        ) : (
          <div className="space-y-3">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onAccept={() => respond(proposal, 'accept')}
                onReject={() => openRejectModal(proposal)}
                onCancel={() => respond(proposal, 'cancel')}
              />
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={offerModal} onClose={closeOffer} title="Đề nghị tài trợ" size="xl">
        <form onSubmit={submitOffer} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-warmink">Sự kiện muốn tài trợ *</label>
            <select
              value={form.eventId}
              onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))}
              className="input-field"
            >
              <option value="">Chọn sự kiện muốn tài trợ</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} {ev.startDate ? `- ${fmtDateTime(ev.startDate)}` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedEvent.title}</p>
                  <p className="mt-1 text-blue-700">{selectedEvent.description || 'Sự kiện đang mở nhận đề nghị tài trợ.'}</p>
                </div>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <div className="grid gap-2 text-xs text-blue-800 sm:grid-cols-3">
                <span><i className="fa-solid fa-calendar mr-1" />{fmtDateTime(selectedEvent.startDate) || '-'}</span>
                <span><i className="fa-solid fa-location-dot mr-1" />{selectedEvent.location || '-'}</span>
                <span><i className="fa-solid fa-user mr-1" />{selectedEvent.organizerName || '-'}</span>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-warmink">Số tiền *</label>
              <input
                type="number"
                min="1"
                value={form.offeredAmount}
                onChange={(e) => setForm((f) => ({ ...f, offeredAmount: e.target.value }))}
                className="input-field"
                placeholder="VD: 5000000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-warmink">Tên hiển thị công khai</label>
              <input
                value={form.publicSponsorName}
                onChange={(e) => setForm((f) => ({ ...f, publicSponsorName: e.target.value }))}
                className="input-field"
                placeholder="VD: Công ty ABC"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-warmink">Tiêu đề tài trợ *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input-field"
              placeholder="VD: Đồng hành cùng chương trình mùa hè xanh"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-warmink">Nội dung đề nghị *</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="input-field resize-none"
              placeholder="Mô tả mong muốn tài trợ, cách phối hợp và thông tin liên hệ cần thiết."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-warmink">Mục đích tài trợ</label>
            <textarea
              rows={2}
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              className="input-field resize-none"
              placeholder="VD: Hỗ trợ chi phí vận chuyển, vật tư tổ chức, truyền thông..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-warmink">Thông điệp công khai</label>
            <textarea
              rows={2}
              value={form.publicMessage}
              onChange={(e) => setForm((f) => ({ ...f, publicMessage: e.target.value }))}
              className="input-field resize-none"
              placeholder="Thông điệp sẽ hiển thị nếu tài trợ được công khai."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              label="Logo tài trợ"
              value={form.logoUrl}
              onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              helper="Upload logo hoặc ảnh đại diện nhà tài trợ."
              compact
            />
            <div>
              <label className="mb-1 block text-sm font-semibold text-warmink">URL đính kèm</label>
              <input
                value={form.attachmentUrl}
                onChange={(e) => setForm((f) => ({ ...f, attachmentUrl: e.target.value }))}
                className="input-field"
                placeholder="/api/uploads/files/..."
              />
              <p className="mt-2 text-xs text-warmink-2">Có thể để trống nếu không có hồ sơ tài trợ kèm theo.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeOffer} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={saving || events.length === 0} className="btn-primary flex items-center gap-2">
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Gửi đề nghị
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Từ chối đề nghị" size="sm">
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <p className="text-sm leading-6 text-warmink-2">
            Vui lòng nhập lý do từ chối để nhà tổ chức hiểu phản hồi của bạn.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="input-field resize-none"
            placeholder="Nhập lý do từ chối..."
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setRejectModal(false)} className="btn-secondary">Hủy</button>
            <button
              type="button"
              onClick={submitReject}
              disabled={saving || rejectReason.trim().length < 10}
              className="btn-danger flex items-center gap-2"
            >
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Từ chối
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }) {
  const tones = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    indigo: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone] || tones.blue}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-warmink-2">{label}</p>
          <p className="mt-1 text-xl font-bold text-warmink">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({ proposal, onAccept, onReject, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const canRespondToInvite = proposal.type === 'OrganizerRequest' && proposal.status === 'Pending';
  const canCancelOffer = proposal.type === 'SponsorOffer' && proposal.status === 'Pending';
  const hasReport = proposal.status === 'Reported'
    && (proposal.reportSummary || proposal.expenseDetails || proposal.reportAttachmentUrl);
  const proposalAmount = getProposalAmount(proposal);

  return (
    <article className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ProposalStatusBadge status={proposal.status} />
            <span className="rounded-full border border-warmborder bg-surface-2 px-2.5 py-1 text-xs font-semibold text-warmink-2">
              {TYPE_LABEL[proposal.type] || proposal.type || 'Tài trợ'}
            </span>
            {proposal.eventStatus && <StatusBadge status={proposal.eventStatus} />}
          </div>

          <Link to={`/events/${proposal.eventId}`} className="mt-3 block text-lg font-semibold text-warmink hover:text-blue-700">
            {proposal.eventTitle || `Sự kiện #${proposal.eventId}`}
          </Link>
          <p className="mt-1 text-sm font-semibold text-warmink-2">{proposal.title || 'Đề nghị tài trợ'}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-warmink-2">{proposal.message || '-'}</p>

          <div className="mt-4 grid gap-2 text-sm text-warmink-2 sm:grid-cols-2 xl:grid-cols-3">
            <Info icon="fa-calendar" text={fmtDateTime(proposal.eventStartDate) || 'Chưa có thời gian'} />
            <Info icon="fa-location-dot" text={proposal.eventLocation || 'Chưa có địa điểm'} />
            <Info icon="fa-building" text={proposal.organizerName ? `Organizer: ${proposal.organizerName}` : 'Organizer: -'} />
            {proposal.organizerEmail && <Info icon="fa-envelope" text={proposal.organizerEmail} />}
            {proposal.organizerPhone && <Info icon="fa-phone" text={proposal.organizerPhone} />}
            <Info icon="fa-sack-dollar" text={`Đề nghị: ${money(proposal.offeredAmount ?? proposal.requestedAmount ?? proposal.amount ?? 0)}`} />
            {proposal.actualReceivedAmount != null && (
              <Info icon="fa-circle-check" text={`Thực nhận: ${money(proposal.actualReceivedAmount)}`} />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-warmink-3">
            {proposal.createdAt && <span>Tạo: {fmtDateTime(proposal.createdAt)}</span>}
            {proposal.respondedAt && <span>Phản hồi: {fmtDateTime(proposal.respondedAt)}</span>}
            {proposal.receivedAt && <span>Ghi nhận: {fmtDateTime(proposal.receivedAt)}</span>}
          </div>

          {proposal.responseMessage && (
            <div className="mt-3 rounded-lg border border-warmborder bg-surface-2 px-3 py-2 text-sm text-warmink-2">
              <span className="font-semibold text-warmink-2">Phản hồi:</span> {proposal.responseMessage}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {canRespondToInvite && (
            <>
              <button type="button" onClick={onAccept} className="btn-primary btn-sm flex items-center gap-2">
                <i className="fa-solid fa-check" />
                Chấp nhận
              </button>
              <button type="button" onClick={onReject} className="btn-danger btn-sm flex items-center gap-2">
                <i className="fa-solid fa-xmark" />
                Từ chối
              </button>
            </>
          )}
          {canCancelOffer && (
            <button type="button" onClick={onCancel} className="btn-secondary btn-sm flex items-center gap-2">
              <i className="fa-solid fa-ban" />
              Hủy đề nghị
            </button>
          )}
          {proposal.status === 'Accepted' && (
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Chờ nhà tổ chức ghi nhận tiền đã nhận.
            </span>
          )}
        </div>
      </div>

      {(proposal.status === 'Received' || proposal.status === 'Reported') && (
        <div className="mt-4 border-t border-warmborder pt-4">
          <div className="flex flex-wrap gap-4 text-xs text-warmink-2">
            <Step done label="Đã chấp nhận" />
            <Step done label={`Đã nhận tiền${proposal.actualReceivedAmount != null ? ` (${money(proposal.actualReceivedAmount)})` : ''}`} />
            <Step done={proposal.eventStatus === 'Completed'} label={proposal.eventStatus === 'Completed' ? 'Sự kiện đã hoàn thành' : 'Theo dõi tiến độ sự kiện'} />
            {proposal.status === 'Reported' && <Step done label="Đã có báo cáo" />}
          </div>
          <Link
            to={`/events/${proposal.eventId}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
          >
            <i className="fa-solid fa-chart-simple text-[11px]" /> Xem tác động &amp; minh bạch của sự kiện
          </Link>
        </div>
      )}

      {hasReport && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-[10px]`} />
            {expanded ? 'Ẩn báo cáo' : 'Xem báo cáo sử dụng'}
          </button>
          {expanded && (
            <div className="mt-3 space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
              {proposal.reportSummary && (
                <div>
                  <p className="font-semibold text-blue-800">Tóm tắt báo cáo</p>
                  <p className="mt-1 leading-6 text-blue-950">{proposal.reportSummary}</p>
                </div>
              )}
              {proposal.expenseDetails && (
                <div>
                  <p className="font-semibold text-blue-800">Chi tiết chi phí</p>
                  <p className="mt-1 whitespace-pre-wrap leading-6 text-blue-950">{proposal.expenseDetails}</p>
                </div>
              )}
              {proposal.reportAttachmentUrl && (
                <a
                  href={proposal.reportAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                  <i className="fa-solid fa-paperclip" />
                  Xem tệp đính kèm
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Info({ icon, text }) {
  return (
    <span className="min-w-0 truncate">
      <i className={`fa-solid ${icon} mr-1.5 text-warmink-3`} />
      {text}
    </span>
  );
}

function Step({ done, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${done ? 'bg-emerald-500' : 'bg-amber-400'}`} />
      {label}
    </span>
  );
}
