import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Tabs from '../../components/ui/Tabs';
import AdminCategories from './AdminCategories';
import AdminSkills from './AdminSkills';
import AdminBadges from './AdminBadges';

const TABS = [
  { key: 'categories', label: 'Danh mục sự kiện' },
  { key: 'skills', label: 'Kỹ năng' },
  { key: 'badges', label: 'Huy hiệu' },
];

export default function AdminCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.find((t) => t.key === searchParams.get('tab'))?.key || 'categories';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-warmink">Danh mục hệ thống</h1>
        <p className="text-sm text-warmink-2 mt-1">
          Cấu hình danh mục sự kiện, bộ kỹ năng và huy hiệu dùng chung trên toàn nền tảng.
        </p>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={(key) => setSearchParams({ tab: key }, { replace: true })} />

      {tab === 'categories' && <AdminCategories embedded />}
      {tab === 'skills' && <AdminSkills embedded />}
      {tab === 'badges' && <AdminBadges embedded />}
    </div>
  );
}
