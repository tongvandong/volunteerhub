import React, { useEffect, useMemo, useState } from 'react';
import { sponsorProfileApi, sponsorshipProposalApi } from '../../services/api';
import AvatarUploadField from '../../components/ui/AvatarUploadField';
import Skeleton from '../../components/ui/Skeleton';

const EMPTY_FORM = {
  organizationName: '',
  representativeName: '',
  contactEmail: '',
  phone: '',
  website: '',
  logoUrl: '',
  description: '',
};

function fmtMoney(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(n || 0));
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-lg bg-white p-5" style={{ border: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-4">
          <Skeleton variant="avatar" className="h-20 w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-white space-y-4 p-5" style={{ border: '1px solid var(--c-border)' }}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

export default function SponsorProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [proposals, setProposals] = useState([]);

  const displayName = form.organizationName.trim() || 'Hồ sơ nhà tài trợ';

  useEffect(() => {
    let alive = true;
    Promise.all([
      sponsorProfileApi.get().catch(() => ({ data: {} })),
      sponsorshipProposalApi.getMy().catch(() => ({ data: [] })),
    ])
      .then(([profileRes, proposalsRes]) => {
        if (!alive) return;
        const p = profileRes.data || {};
        setForm({
          organizationName: p.organizationName || '',
          representativeName: p.representativeName || '',
          contactEmail: p.contactEmail || '',
          phone: p.phone || '',
          website: p.website || '',
          logoUrl: p.logoUrl || '',
          description: p.description || '',
        });
        setProposals(proposalsRes.data || []);
      })
      .catch(() => {
        if (alive) setMsg({ type: 'error', text: 'Không thể tải hồ sơ nhà tài trợ.' });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const received = proposals.filter((p) => p.status === 'Received' || p.status === 'Reported');
    const receivedAmount = received.reduce((s, p) => s + (Number(p.actualReceivedAmount ?? p.amount ?? p.offeredAmount ?? p.requestedAmount) || 0), 0);
    const distinctEvents = new Set(received.map((p) => p.eventId)).size;
    const pending = proposals.filter((p) => p.status === 'Pending' || p.status === 'Accepted').length;
    return { receivedAmount, eventsCount: distinctEvents, pendingCount: pending };
  }, [proposals]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!form.organizationName.trim()) return 'Vui lòng nhập tên nhà tài trợ hoặc doanh nghiệp.';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      return 'Email liên hệ không hợp lệ.';
    }
    if (form.website && !/^https?:\/\/.+/i.test(form.website.trim())) {
      return 'Website nên bắt đầu bằng http:// hoặc https://.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMsg({ type: 'error', text: error });
      return;
    }

    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await sponsorProfileApi.update({
        ...form,
        organizationName: form.organizationName.trim(),
        representativeName: form.representativeName.trim(),
        contactEmail: form.contactEmail.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
      });
      setMsg({ type: 'success', text: 'Cập nhật hồ sơ thành công.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Cập nhật hồ sơ thất bại.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Hero */}
      <div className="rounded-lg overflow-hidden bg-white" style={{ border: '1px solid var(--c-border)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #f59e0b 0%, #b45309 100%)' }} />
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xl font-semibold"
                style={{ background: '#b45309', border: '1px solid rgba(15,15,15,0.10)' }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: 'rgba(180,83,9,0.10)', color: '#b45309' }}
                  >
                    <i className="fa-solid fa-hand-holding-dollar" /> Nhà tài trợ
                  </span>
                </div>
                <h1 className="text-[18px] font-semibold mt-1.5 truncate" style={{ color: 'var(--c-ink)' }}>{displayName}</h1>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(15,15,15,0.50)' }}>
                  {form.contactEmail || form.website || 'Cập nhật để nhà tổ chức dễ liên hệ.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid divide-x"
          style={{
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            borderTop: '1px solid rgba(15,15,15,0.06)',
          }}
        >
          {[
            { label: 'Tổng đã tài trợ', value: fmtMoney(stats.receivedAmount), icon: 'fa-sack-dollar', color: '#15803d' },
            { label: 'Sự kiện đã tài trợ', value: stats.eventsCount, icon: 'fa-calendar-check', color: '#1b61c9' },
            { label: 'Đang chờ / đã chấp nhận', value: stats.pendingCount, icon: 'fa-hourglass-half', color: '#b45309' },
          ].map((s, i, arr) => (
            <div key={s.label} className="py-4 text-center" style={i < arr.length - 1 ? { borderRight: '1px solid rgba(15,15,15,0.06)' } : undefined}>
              <i className={`fa-solid ${s.icon} text-[13px] mb-1.5 block`} style={{ color: s.color }} />
              <p className="text-[18px] font-bold leading-none" style={{ color: 'var(--c-ink)' }}>{s.value}</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(15,15,15,0.45)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {msg.text && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={msg.type === 'success'
            ? { background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.20)', color: '#15803d' }
            : { background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.18)', color: '#b91c1c' }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Thông tin cơ bản */}
        <section className="rounded-lg bg-white p-5" style={{ border: '1px solid var(--c-border)' }}>
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--c-ink)' }}>Thông tin cơ bản</h2>
            <p className="mt-1 text-xs" style={{ color: 'rgba(15,15,15,0.50)' }}>
              Thông tin này giúp nhà tổ chức nhận diện đơn vị tài trợ.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <AvatarUploadField
              label="Logo / ảnh đại diện"
              value={form.logoUrl}
              onChange={(url) => setField('logoUrl', url)}
              helper="Ảnh sẽ được căn tròn để đồng bộ với giao diện hệ thống."
            />

            <div className="space-y-3">
              <Field label="Tên nhà tài trợ / doanh nghiệp" required>
                <input
                  value={form.organizationName}
                  onChange={(e) => setField('organizationName', e.target.value)}
                  className="input-field"
                  placeholder="VD: Công ty TNHH Tài trợ Xanh"
                />
              </Field>
              <Field label="Người đại diện">
                <input
                  value={form.representativeName}
                  onChange={(e) => setField('representativeName', e.target.value)}
                  className="input-field"
                  placeholder="VD: Nguyễn Văn A"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Liên hệ */}
        <section className="rounded-lg bg-white p-5" style={{ border: '1px solid var(--c-border)' }}>
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--c-ink)' }}>Thông tin liên hệ</h2>
            <p className="mt-1 text-xs" style={{ color: 'rgba(15,15,15,0.50)' }}>
              Dùng khi nhà tổ chức cần trao đổi về cam kết hoặc xác nhận tài trợ.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email liên hệ">
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setField('contactEmail', e.target.value)}
                className="input-field"
                placeholder="contact@example.org"
              />
            </Field>
            <Field label="Số điện thoại">
              <input
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className="input-field"
                placeholder="090..."
              />
            </Field>
            <Field label="Website">
              <input
                value={form.website}
                onChange={(e) => setField('website', e.target.value)}
                className="input-field"
                placeholder="https://example.org"
              />
            </Field>
          </div>
        </section>

        {/* Giới thiệu */}
        <section className="rounded-lg bg-white p-5" style={{ border: '1px solid var(--c-border)' }}>
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--c-ink)' }}>Giới thiệu</h2>
            <p className="mt-1 text-xs" style={{ color: 'rgba(15,15,15,0.50)' }}>
              Mô tả ngắn về lĩnh vực hoạt động, tiêu chí tài trợ hoặc thông điệp cộng đồng.
            </p>
          </div>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className="input-field resize-none"
            placeholder="Chia sẻ vài dòng về đơn vị tài trợ..."
          />
        </section>

        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-white/95 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0"
          style={{ borderTop: '1px solid var(--c-border)' }}>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto">
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Lưu hồ sơ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium" style={{ color: 'rgba(15,15,15,0.70)' }}>
        {label} {required && <span style={{ color: '#b91c1c' }}>*</span>}
      </span>
      {children}
    </label>
  );
}
