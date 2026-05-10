import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supportCampaignApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';
}

function money(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
}

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await supportCampaignApi.getMyDonations();
    setDonations(r.data || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const cancelDonation = async (donation) => {
    if (!confirm('Hủy khoản ủng hộ đang chờ xác nhận này?')) return;
    await supportCampaignApi.cancelDonation(donation.id);
    await load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ủng hộ của tôi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Theo dõi các khoản ủng hộ cá nhân đã gửi vào sự kiện.</p>
      </div>

      {donations.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-hand-holding-heart text-4xl text-gray-300 mb-3 block" />
          <p className="text-gray-500">Bạn chưa gửi khoản ủng hộ nào.</p>
          <Link to="/events" className="btn-primary mt-4 inline-flex items-center gap-2">
            <i className="fa-solid fa-calendar-days" /> Xem sự kiện
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Sự kiện</th>
                <th className="text-left px-4 py-3">Đợt kêu gọi</th>
                <th className="text-left px-4 py-3">Số tiền</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3">Ngày gửi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donations.map((donation) => (
                <tr key={donation.id} className="odd:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/events/${donation.eventId}`} className="font-medium text-primary-700 hover:underline">
                      {donation.eventTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{donation.campaignTitle}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{money(donation.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
                      {donation.status}
                    </span>
                    {donation.rejectedReason && <p className="mt-1 text-xs text-red-600">{donation.rejectedReason}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(donation.createdAt)}</td>
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
