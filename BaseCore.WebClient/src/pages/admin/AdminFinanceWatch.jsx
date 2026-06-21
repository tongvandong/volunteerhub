import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-');

function Stat({ label, value, icon, tone = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="card p-4">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${colors[tone] || colors.blue}`}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <p className="text-sm text-warmink-2">{label}</p>
      <p className="mt-1 text-xl font-bold text-warmink">{value}</p>
    </div>
  );
}

function Empty({ children }) {
  return <div className="rounded-lg border border-dashed border-warmborder p-6 text-center text-sm text-warmink-2">{children}</div>;
}

export default function AdminFinanceWatch() {
  const [data, setData] = useState({
    overview: null,
    staleDonations: [],
    unreportedCampaigns: [],
    openProposals: [],
  });
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [loadError, setLoadError] = useState('');

  const load = () => {
    setLoading(true);
    // allSettled: một mục lỗi không làm trắng toàn bộ trang giám sát.
    Promise.allSettled([
      adminApi.getFinanceOverview(),
      adminApi.getStaleDonations({ days }),
      adminApi.getUnreportedCampaigns(),
      adminApi.getOpenProposalsPastEvent(),
    ])
      .then(([overview, staleDonations, unreportedCampaigns, openProposals]) => {
        const val = (r) => (r.status === 'fulfilled' ? r.value.data : null);
        setData({
          overview: val(overview),
          staleDonations: val(staleDonations) || [],
          unreportedCampaigns: val(unreportedCampaigns) || [],
          openProposals: val(openProposals) || [],
        });
        if ([overview, staleDonations, unreportedCampaigns, openProposals].some((r) => r.status === 'rejected')) {
          setLoadError('Một số mục giám sát không tải được. Dữ liệu hiển thị có thể chưa đầy đủ.');
        } else {
          setLoadError('');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  if (loading) return <LoadingSpinner />;

  const totals = data.overview?.totals || {};

  return (
    <div className="space-y-5">
      {loadError && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--c-amber-50)', border: '1px solid var(--c-amber)', color: 'var(--c-amber)' }}>
          <i className="fa-solid fa-triangle-exclamation mr-2" />{loadError}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-warmink">Đối soát tài chính</h1>
          <p className="mt-1 text-sm text-warmink-2">Chỉ xem và đối soát các khoản cần xử lý. Không sửa/xóa dữ liệu tài chính tại màn này.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-warmink-2">Donation chờ quá</label>
          <input type="number" min="1" max="60" value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 7))} className="input-field w-20" />
          <span className="text-sm text-warmink-2">ngày</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Đã xác nhận" value={money(totals.financialConfirmedAmount)} icon="fa-sack-dollar" tone="green" />
        <Stat label="Ủng hộ chờ xác nhận" value={money(totals.donationPendingAmount)} icon="fa-clock" tone="amber" />
        <Stat label="Campaign" value={totals.campaigns || 0} icon="fa-bullhorn" />
        <Stat label="Đề nghị tài trợ" value={totals.proposals || 0} icon="fa-handshake" />
      </div>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-warmink">Donation chờ xác nhận lâu</h2>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{data.staleDonations.length} khoản</span>
        </div>
        {data.staleDonations.length === 0 ? (
          <Empty>Không có khoản ủng hộ chờ xác nhận quá hạn.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-2 text-left">Khoản ủng hộ</th>
                  <th className="px-3 py-2 text-left">Sự kiện</th>
                  <th className="px-3 py-2 text-left">Organizer</th>
                  <th className="px-3 py-2 text-right">Số tiền</th>
                  <th className="px-3 py-2 text-right">Tuổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmborder">
                {data.staleDonations.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-warmink">{item.donorName || item.donorUserName || `#${item.donorUserId}`}</div>
                      <div className="text-xs text-warmink-2">{item.campaignTitle}</div>
                    </td>
                    <td className="px-3 py-2"><Link to={`/events/${item.eventId}`} className="text-primary-600 hover:underline">{item.eventTitle}</Link></td>
                    <td className="px-3 py-2 text-warmink-2">{item.organizerName}</td>
                    <td className="px-3 py-2 text-right font-semibold">{money(item.amount)}</td>
                    <td className="px-3 py-2 text-right text-warmink-2">{item.ageInDays} ngày</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-warmink">Campaign có tiền nhưng chưa báo cáo</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{data.unreportedCampaigns.length} campaign</span>
        </div>
        {data.unreportedCampaigns.length === 0 ? (
          <Empty>Không có campaign cần nhắc báo cáo.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.unreportedCampaigns.map((item) => (
              <div key={item.id} className="rounded-lg border border-warmborder p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-warmink">{item.title}</p>
                    <Link to={`/events/${item.eventId}`} className="text-sm text-primary-600 hover:underline">{item.eventTitle}</Link>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded bg-surface-2 p-2">
                    <p className="text-warmink-2">Đã xác nhận</p>
                    <p className="font-semibold">{money(item.confirmedAmount)}</p>
                  </div>
                  <div className="rounded bg-surface-2 p-2">
                    <p className="text-warmink-2">Kết thúc</p>
                    <p className="font-semibold">{fmtDate(item.endDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-warmink">Đề nghị tài trợ còn mở sau khi event kết thúc/hủy</h2>
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{data.openProposals.length} đề nghị</span>
        </div>
        {data.openProposals.length === 0 ? (
          <Empty>Không có đề nghị tài trợ bị treo.</Empty>
        ) : (
          <div className="space-y-2">
            {data.openProposals.map((item) => (
              <div key={item.id} className="rounded-lg border border-warmborder p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-warmink">{item.title}</p>
                    <p className="text-sm text-warmink-2">
                      {item.sponsorName} · {item.organizerName} · {money(item.amount)}
                    </p>
                    <Link to={`/events/${item.eventId}`} className="text-sm text-primary-600 hover:underline">{item.eventTitle}</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-warmink-2">{item.daysSinceEnd} ngày sau event</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
