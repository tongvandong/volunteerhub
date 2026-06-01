import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supportCampaignApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { fmtDateTime, money } from '../../utils/format';

const statusMeta = {
  PendingConfirmation: { label: 'Chờ xác nhận', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  Confirmed: { label: 'Đã xác nhận', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  Rejected: { label: 'Bị từ chối', className: 'border-red-200 bg-red-50 text-red-700' },
  Cancelled: { label: 'Đã hủy', className: 'border-warmborder bg-surface-2 text-warmink-2' },
};

const filters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'PendingConfirmation', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Rejected', label: 'Bị từ chối' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

function DonationStatusBadge({ status }) {
  const meta = statusMeta[status] || { label: status || 'Không rõ', className: 'border-warmborder bg-white text-warmink-2' };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    const r = await supportCampaignApi.getMyDonations();
    setDonations(r.data || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const filteredDonations = useMemo(
    () => donations.filter((donation) => statusFilter === 'all' || donation.status === statusFilter),
    [donations, statusFilter],
  );

  const summary = useMemo(() => {
    const confirmed = donations.filter((donation) => donation.status === 'Confirmed');
    const pending = donations.filter((donation) => donation.status === 'PendingConfirmation');
    return {
      totalConfirmed: confirmed.reduce((sum, donation) => sum + (Number(donation.amount) || 0), 0),
      totalPending: pending.reduce((sum, donation) => sum + (Number(donation.amount) || 0), 0),
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
    };
  }, [donations]);

  const cancelDonation = async (donation) => {
    if (!confirm('Hủy khoản ủng hộ đang chờ xác nhận này?')) return;
    try {
      await supportCampaignApi.cancelDonation(donation.id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Hủy thất bại. Vui lòng thử lại.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-warmink">Ủng hộ của tôi</h1>
        <p className="mt-0.5 text-sm text-warmink-2">
          Theo dõi các khoản ủng hộ cá nhân đã gửi vào sự kiện.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-medium uppercase text-warmink-2">Đã ghi nhận</p>
          <p className="mt-1 text-2xl font-bold text-warmink">{money(summary.totalConfirmed)}</p>
          <p className="text-xs text-warmink-2">{summary.confirmedCount} khoản đã xác nhận</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase text-warmink-2">Đang chờ</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{money(summary.totalPending)}</p>
          <p className="text-xs text-warmink-2">{summary.pendingCount} khoản chờ xác nhận</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase text-warmink-2">Tổng lịch sử</p>
          <p className="mt-1 text-2xl font-bold text-warmink">{donations.length}</p>
          <p className="text-xs text-warmink-2">Tất cả khoản đã gửi</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              statusFilter === filter.value
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-warmborder bg-white text-warmink-2 hover:border-warmborder-2'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {donations.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-hand-holding-heart mb-3 block text-4xl text-warmink-3" />
          <p className="text-warmink-2">Bạn chưa gửi khoản ủng hộ nào.</p>
          <Link to="/events" className="btn-primary mt-4 inline-flex items-center gap-2">
            <i className="fa-solid fa-calendar-days" /> Xem sự kiện
          </Link>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="card p-10 text-center text-warmink-2">
          Không có khoản ủng hộ nào ở trạng thái này.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Sự kiện</th>
                <th className="px-4 py-3 text-left">Đợt kêu gọi</th>
                <th className="px-4 py-3 text-left">Số tiền</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày gửi</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="odd:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <Link to={`/events/${donation.eventId}`} className="font-medium text-primary-700 hover:underline">
                      {donation.eventTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-warmink-2">{donation.campaignTitle}</td>
                  <td className="px-4 py-3 font-semibold text-warmink">{money(donation.amount)}</td>
                  <td className="px-4 py-3">
                    <DonationStatusBadge status={donation.status} />
                    {donation.rejectedReason && <p className="mt-1 text-xs text-red-600">{donation.rejectedReason}</p>}
                  </td>
                  <td className="px-4 py-3 text-warmink-2">{fmtDateTime(donation.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {donation.status === 'PendingConfirmation' && (
                      <button onClick={() => cancelDonation(donation)} className="btn-secondary btn-sm">
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
