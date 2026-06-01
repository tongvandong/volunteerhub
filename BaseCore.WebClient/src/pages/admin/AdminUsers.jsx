import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';

const ROLE_TABS = [
  { key: 'all', label: 'Tất cả', role: '' },
  { key: 'organizers', label: 'Nhà tổ chức', role: '1' },
  { key: 'volunteers', label: 'Tình nguyện viên', role: '0' },
  { key: 'sponsors', label: 'Nhà tài trợ', role: '2' },
];

const ROLE_MAP = {
  0: { key: 'Volunteer', label: 'Tình nguyện viên', className: 'bg-green-100 text-green-700' },
  1: { key: 'Organizer', label: 'Nhà tổ chức', className: 'bg-blue-100 text-blue-700' },
  2: { key: 'Sponsor', label: 'Nhà tài trợ', className: 'bg-yellow-100 text-yellow-700' },
  3: { key: 'Admin', label: 'Admin', className: 'bg-purple-100 text-purple-700' },
};

function RoleBadge({ userType, role }) {
  const mapped = ROLE_MAP[userType] || ROLE_MAP[role] || { label: role || `Loại ${userType}`, className: 'bg-surface-2 text-warmink-2' };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mapped.className}`}>
      {mapped.label}
    </span>
  );
}

export default function AdminUsers({
  initialRoleFilter = '',
  title = 'Tài khoản',
  description = 'Quản lý toàn bộ tài khoản theo vai trò — xem, sửa, khóa/mở và xóa khi cần.',
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const showRoleTabs = initialRoleFilter === '';
  const activeTab = ROLE_TABS.find((t) => t.key === searchParams.get('tab'))?.key || 'all';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState(
    showRoleTabs ? (ROLE_TABS.find((t) => t.key === activeTab)?.role ?? '') : initialRoleFilter
  );
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toggling, setToggling] = useState({});
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', name: '', email: '', phone: '', userType: 0 });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const submitCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (createForm.password.length < 8) { setCreateError('Mật khẩu tối thiểu 8 ký tự.'); return; }
    setCreating(true);
    try {
      await adminApi.createUser({ ...createForm, userType: Number(createForm.userType) });
      setCreateModal(false);
      setCreateForm({ username: '', password: '', name: '', email: '', phone: '', userType: 0 });
      load(1, search);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Tạo tài khoản thất bại.');
    } finally {
      setCreating(false);
    }
  };

  const buildParams = (p = 1, q = search) => ({
    page: p,
    pageSize: 15,
    search: q,
    ...(roleFilter !== '' ? { userType: Number(roleFilter) } : {}),
    ...(statusFilter !== '' ? { isActive: statusFilter === 'active' } : {}),
  });

  const load = (p = 1, q = search) => {
    setLoading(true);
    adminApi.getUsers(buildParams(p, q))
      .then((r) => {
        setUsers(r.data?.items || []);
        setTotalPages(r.data?.totalPages || 1);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1, search);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (!showRoleTabs) {
      setRoleFilter(initialRoleFilter);
      setPage(1);
    }
  }, [initialRoleFilter, showRoleTabs]);

  // Tab-driven role filter (canonical /admin/users page)
  useEffect(() => {
    if (showRoleTabs) {
      setRoleFilter(ROLE_TABS.find((t) => t.key === activeTab)?.role ?? '');
      setPage(1);
    }
  }, [activeTab, showRoleTabs]);

  const handleTabChange = (key) => {
    setSearchParams(key === 'all' ? {} : { tab: key }, { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const toggleStatus = async (user) => {
    if (user.userType === 3) return;
    setToggling((prev) => ({ ...prev, [user.id]: true }));
    try {
      await adminApi.toggleUserStatus(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setToggling((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const openDetail = async (user) => {
    setDetail(user);
    setDetailLoading(true);
    try {
      const response = await adminApi.getUserDetail(user.id);
      setDetail(response.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Không tải được chi tiết tài khoản');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || user.contact || '',
      isActive: Boolean(user.isActive),
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      // Chỉ gửi thông tin liên hệ; trạng thái khóa/mở đi qua nút Khóa/Mở (có cascade).
      const response = await adminApi.updateUser(editUser.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
      });
      const updated = response.data;
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      if (detail?.id === updated.id) setDetail((prev) => ({ ...prev, ...updated }));
      setEditUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Lưu tài khoản thất bại');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    if (!confirm(`Xóa tài khoản ${user.name || user.userName}? Chỉ tài khoản chưa có dữ liệu nghiệp vụ mới được xóa.`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setDetail(null);
      setEditUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa tài khoản này. Hãy khóa tài khoản nếu đã có dữ liệu nghiệp vụ.');
    } finally {
      setDeleting(false);
    }
  };

  const detailImpact = detail?.impact;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-warmink">{title}</h1>
          <p className="text-sm text-warmink-2">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm tên, username, email..."
              className="input-field w-60 text-sm"
            />
            <button type="submit" className="btn-secondary btn-sm">
              <i className="fa-solid fa-search" />
            </button>
          </form>
          <button type="button" onClick={() => { setCreateError(''); setCreateModal(true); }} className="btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap">
            <i className="fa-solid fa-user-plus" /> Tạo tài khoản
          </button>
        </div>
      </div>

      {showRoleTabs && (
        <Tabs tabs={ROLE_TABS} value={activeTab} onChange={handleTabChange} />
      )}

      <div className="flex flex-wrap gap-3">
        {!showRoleTabs && (
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field w-48 text-sm" disabled={initialRoleFilter !== ''}>
            <option value="">Tất cả vai trò</option>
            <option value="0">Tình nguyện viên</option>
            <option value="1">Nhà tổ chức</option>
            <option value="2">Nhà tài trợ</option>
            <option value="3">Admin</option>
          </select>
        )}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-44 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Bị khóa</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : users.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-users text-4xl text-warmink-3 mb-3 block" />
          <p className="text-warmink-2">Không tìm thấy người dùng</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Người dùng</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Vai trò</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {users.map((u) => {
                const displayName = u.name || u.userName || 'Người dùng';
                const isAdmin = u.userType === 3;

                return (
                  <tr key={u.id} className="odd:bg-surface-2/50 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-primary-600 text-xs font-bold">
                          {displayName[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-warmink">{displayName}</div>
                          <div className="text-xs text-warmink-3">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-warmink-2">{u.email || '-'}</td>
                    <td className="px-4 py-3"><RoleBadge userType={u.userType} role={u.role} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button onClick={() => openDetail(u)} className="btn-secondary btn-sm text-xs">
                          <i className="fa-solid fa-eye mr-1" /> Xem
                        </button>
                        {!isAdmin && (
                          <>
                            <button onClick={() => openEdit(u)} className="btn-secondary btn-sm text-xs">
                              <i className="fa-solid fa-pen mr-1" /> Sửa
                            </button>
                            <button
                              onClick={() => toggleStatus(u)}
                              disabled={toggling[u.id]}
                              className={`btn-sm text-xs flex items-center gap-1 ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                            >
                              {toggling[u.id]
                                ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <i className={`fa-solid ${u.isActive ? 'fa-lock' : 'fa-lock-open'}`} />}
                              {u.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>
                            <button onClick={() => deleteUser(u)} disabled={deleting} className="btn-danger btn-sm text-xs">
                              <i className="fa-solid fa-trash mr-1" /> Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => load(p)} />
      )}

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Chi tiết tài khoản" size="lg">
        {detailLoading ? <LoadingSpinner /> : detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label="ID" value={detail.id} />
              <Info label="Username" value={detail.userName} />
              <Info label="Họ tên" value={detail.name} />
              <Info label="Email" value={detail.email} />
              <Info label="Số điện thoại" value={detail.phone || '-'} />
              <Info label="Trạng thái" value={detail.isActive ? 'Hoạt động' : 'Bị khóa'} />
              <Info label="Ngày tạo" value={detail.created ? new Date(detail.created).toLocaleString('vi-VN') : '-'} />
              <div>
                <p className="text-xs text-warmink-2">Vai trò</p>
                <RoleBadge userType={detail.userType} role={detail.role} />
              </div>
            </div>

            {detail.volunteerProfile && (
              <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
                <p className="font-semibold text-warmink">Hồ sơ tình nguyện viên</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-warmink-2">
                  <Info label="KYC" value={detail.volunteerProfile.kycStatus} />
                  <Info label="Tổng giờ" value={`${detail.volunteerProfile.totalVolunteerHours || 0}h`} />
                  <Info label="Kỹ năng" value={`${detail.volunteerProfile.skillCount || 0} khai báo, ${detail.volunteerProfile.verifiedSkillCount || 0} đã xác minh`} />
                </div>
              </div>
            )}

            {detail.organizerVerification && (
              <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
                <p className="font-semibold text-warmink">Hồ sơ nhà tổ chức</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-warmink-2">
                  <Info label="Tổ chức" value={detail.organizerVerification.organizationName || '-'} />
                  <Info label="Trạng thái xác minh" value={detail.organizerVerification.status || '-'} />
                  <Info label="Địa chỉ" value={detail.organizerVerification.address || '-'} />
                  <Info label="Ghi chú admin" value={detail.organizerVerification.adminNote || '-'} />
                </div>
              </div>
            )}

            {detail.sponsorProfile && (
              <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
                <p className="font-semibold text-warmink">Hồ sơ nhà tài trợ</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-warmink-2">
                  <Info label="Đơn vị" value={detail.sponsorProfile.organizationName || '-'} />
                  <Info label="Người đại diện" value={detail.sponsorProfile.representativeName || '-'} />
                  <Info label="Email liên hệ" value={detail.sponsorProfile.contactEmail || '-'} />
                  <Info label="Đã xác minh" value={detail.sponsorProfile.isVerified ? 'Có' : 'Chưa'} />
                </div>
              </div>
            )}

            {detailImpact && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-amber-800">
                <p className="font-semibold">Dữ liệu liên quan</p>
                <p className="mt-1">
                  Event: {detailImpact.organizedEvents || 0}, đăng ký: {detailImpact.registrations || 0}, ủng hộ: {detailImpact.donations || 0},
                  tài trợ: {detailImpact.sponsorshipProposals || 0}, chứng chỉ: {detailImpact.certificates || 0}, đánh giá: {detailImpact.ratings || 0}.
                </p>
                <p className="mt-1 text-xs">{detail.canDelete ? 'Có thể xóa vì chưa có dữ liệu nghiệp vụ.' : 'Không nên xóa cứng; hãy khóa tài khoản để giữ lịch sử.'}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {detail.userType !== 3 && <button onClick={() => openEdit(detail)} className="btn-secondary">Sửa</button>}
              {detail.userType !== 3 && <button onClick={() => deleteUser(detail)} disabled={deleting} className="btn-danger">Xóa</button>}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={createModal} onClose={() => !creating && setCreateModal(false)} title="Tạo tài khoản" size="md">
        <form onSubmit={submitCreate} className="space-y-4">
          {createError && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', color: '#b91c1c' }}>
              <i className="fa-solid fa-circle-exclamation mr-2" />{createError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">Tên đăng nhập *</label>
              <input value={createForm.username} onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))} className="input-field" required placeholder="username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">Mật khẩu *</label>
              <input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} className="input-field" required placeholder="Tối thiểu 8 ký tự" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">Họ tên</label>
            <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Nguyễn Văn A" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">Email *</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className="input-field" required placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">Số điện thoại</label>
              <input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="0901234567" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">Vai trò *</label>
            <select value={createForm.userType} onChange={(e) => setCreateForm((f) => ({ ...f, userType: e.target.value }))} className="input-field">
              <option value={0}>Tình nguyện viên</option>
              <option value={1}>Nhà tổ chức</option>
              <option value={2}>Nhà tài trợ</option>
              <option value={3}>Quản trị viên</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
              {creating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Sửa tài khoản" size="md">
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">Họ tên *</label>
            <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">Email *</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">Số điện thoại</label>
            <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" />
          </div>
          <p className="rounded-lg border border-warmborder bg-surface-2 p-3 text-xs text-warmink-2">
            <i className="fa-solid fa-circle-info mr-1.5" />
            Để khóa/mở tài khoản, dùng nút <strong>Khóa/Mở khóa</strong> ở danh sách — thao tác đó sẽ tự hủy sự kiện/đợt kêu gọi liên quan và thông báo cho người dùng. Form này chỉ sửa thông tin liên hệ.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-warmink-2">{label}</p>
      <p className="font-medium text-warmink break-words">{value ?? '-'}</p>
    </div>
  );
}
