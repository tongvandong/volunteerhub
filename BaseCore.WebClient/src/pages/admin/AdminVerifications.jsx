import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Tabs from '../../components/ui/Tabs';
import AdminOrganizerVerifications from './AdminOrganizerVerifications';
import AdminVolunteerVerifications from './AdminVolunteerVerifications';

const TABS = [
  { key: 'organizers', label: 'Tổ chức' },
  { key: 'volunteers', label: 'Tình nguyện viên (KYC & kỹ năng)' },
];

export default function AdminVerifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.find((t) => t.key === searchParams.get('tab'))?.key || 'organizers';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-warmink">Duyệt hồ sơ</h1>
        <p className="text-sm text-warmink-2 mt-1">
          Xét duyệt hồ sơ pháp lý của tổ chức và xác minh KYC/kỹ năng của tình nguyện viên.
        </p>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={(key) => setSearchParams({ tab: key }, { replace: true })} />

      {tab === 'organizers' ? <AdminOrganizerVerifications embedded /> : <AdminVolunteerVerifications embedded />}
    </div>
  );
}
