import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { eventApi, registrationApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleDateString('vi-VN') : '';
}

function fmtTime(dt) {
  return dt ? new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
}

export default function ManageEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('registrations');
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [shiftModal, setShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '', endTime: '', maxVolunteers: 10 });
  const [shiftSaving, setShiftSaving] = useState(false);
  const [selectedCheckinRegId, setSelectedCheckinRegId] = useState('');

  useEffect(() => {
    Promise.all([
      eventApi.getById(id),
      eventApi.getRegistrations(id),
      eventApi.getShifts(id),
    ])
      .then(([evRes, regRes, shiftRes]) => {
        setEvent(evRes.data);
        setRegistrations(regRes.data || []);
        setShifts(shiftRes.data || []);
      })
      .catch(() => navigate('/my-events'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async (regId) => {
    try {
      await registrationApi.confirm(id, regId);
      setRegistrations((prev) => prev.map((r) => (r.id === regId ? { ...r, status: 'Confirmed' } : r)));
    } catch (err) {
      alert(err.response?.data?.message || 'Thất bại');
    }
  };

  const handleCancel = async (regId) => {
    if (!confirm('Hủy đăng ký này?')) return;
    try {
      await registrationApi.cancel(id, regId);
      setRegistrations((prev) => prev.map((r) => (r.id === regId ? { ...r, status: 'Cancelled' } : r)));
    } catch (err) {
      alert(err.response?.data?.message || 'Thất bại');
    }
  };

  const handleComplete = async () => {
    if (!confirm('Đánh dấu sự kiện này là hoàn thành? Hệ thống sẽ phát chứng chỉ cho tình nguyện viên đã điểm danh.')) return;
    setCompleting(true);
    try {
      const r = await eventApi.complete(id);
      setEvent((prev) => ({ ...prev, ...r.data, status: 'Completed' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Đánh dấu hoàn thành thất bại');
    } finally {
      setCompleting(false);
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!selectedCheckinRegId || !checkinCode.trim()) return;

    setCheckinLoading(true);
    setCheckinMsg('');

    try {
      await registrationApi.checkin(id, selectedCheckinRegId, { qrCode: checkinCode.trim() });
      setCheckinMsg('success:Điểm danh thành công!');
      setCheckinCode('');
      setSelectedCheckinRegId('');
      const r = await eventApi.getRegistrations(id);
      setRegistrations(r.data || []);
    } catch (err) {
      setCheckinMsg(`error:${err.response?.data?.message || 'Mã không hợp lệ'}`);
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setShiftSaving(true);

    try {
      await eventApi.createShift(id, {
        ...shiftForm,
        eventId: parseInt(id),
        maxVolunteers: parseInt(shiftForm.maxVolunteers),
        startTime: new Date(shiftForm.startTime).toISOString(),
        endTime: new Date(shiftForm.endTime).toISOString(),
      });
      const r = await eventApi.getShifts(id);
      setShifts(r.data || []);
      setShiftModal(false);
      setShiftForm({ name: '', startTime: '', endTime: '', maxVolunteers: 10 });
    } catch (err) {
      alert(err.response?.data?.message || 'Tạo ca thất bại');
    } finally {
      setShiftSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const pending = registrations.filter((r) => r.status === 'Pending');
  const confirmed = registrations.filter((r) => r.status === 'Confirmed');
  const cancelled = registrations.filter((r) => r.status === 'Cancelled');
  const attended = registrations.filter((r) => r.isAttended);
  const totalHours = attended.reduce((sum, r) => sum + (Number(r.volunteerHours) || 0), 0);
  const capacity = event?.maxParticipants || 0;
  const fillRate = capacity > 0 ? Math.round((registrations.length / capacity) * 100) : 0;
  const attendanceRate = confirmed.length > 0 ? Math.round((attended.length / confirmed.length) * 100) : 0;
  const checkinParts = checkinMsg.split(':');
  const checkinType = checkinParts[0];
  const checkinText = checkinParts.slice(1).join(':');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/my-events')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{event?.title}</h1>
          <p className="text-sm text-gray-500">{fmt(event?.startDate)} · {event?.location}</p>
        </div>
        {event?.channel?.id && (
          <Link to={`/channels/${event.channel.id}`} className="btn-secondary btn-sm flex items-center gap-1">
            <i className="fa-solid fa-comments" /> Kênh trao đổi
          </Link>
        )}
        {event?.status === 'Approved' && (
          <button onClick={handleComplete} disabled={completing} className="btn-primary btn-sm flex items-center gap-1">
            {completing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="fa-solid fa-flag-checkered" />}
            Hoàn thành
          </button>
        )}
        <StatusBadge status={event?.status} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Chờ xác nhận', value: pending.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Đã xác nhận', value: confirmed.length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Đã điểm danh', value: attended.length, color: 'text-primary-600', bg: 'bg-primary-50' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { key: 'registrations', label: 'Danh sách đăng ký', icon: 'fa-list' },
          { key: 'shifts', label: 'Ca làm việc', icon: 'fa-clock' },
          { key: 'checkin', label: 'Điểm danh', icon: 'fa-qrcode' },
          { key: 'report', label: 'Báo cáo', icon: 'fa-chart-column' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className={`fa-solid ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'registrations' && (
        <div className="space-y-3">
          {registrations.length === 0 ? (
            <div className="card p-12 text-center">
              <i className="fa-solid fa-users text-4xl text-gray-300 mb-3 block" />
              <p className="text-gray-500">Chưa có tình nguyện viên nào đăng ký</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Tình nguyện viên</th>
                    <th className="text-left px-4 py-3">Ngày đăng ký</th>
                    <th className="text-left px-4 py-3">Trạng thái</th>
                    <th className="text-left px-4 py-3">Điểm danh</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations.map((r) => (
                    <tr key={r.id} className="odd:bg-gray-50/50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.user?.name || r.user?.userName || `User #${r.userId}`}</div>
                        {r.note && <p className="text-xs text-gray-400 italic mt-0.5">"{r.note}"</p>}
                        {r.shift?.name && <p className="text-xs text-primary-600 mt-0.5">Ca: {r.shift.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{fmt(r.registeredAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        {r.isAttended ? (
                          <span className="text-xs bg-primary-50 text-primary-600 border border-primary-100 px-2 py-0.5 rounded-full font-medium">✓ {r.volunteerHours}h</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          {r.status === 'Pending' && (
                            <>
                              <button onClick={() => handleConfirm(r.id)} className="btn-primary btn-sm text-xs">
                                <i className="fa-solid fa-check mr-1" /> Xác nhận
                              </button>
                              <button onClick={() => handleCancel(r.id)} className="btn-danger btn-sm text-xs">
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </>
                          )}
                          {r.status === 'Confirmed' && !r.isAttended && (
                            <button onClick={() => handleCancel(r.id)} className="btn-secondary btn-sm text-xs">
                              <i className="fa-solid fa-xmark mr-1" /> Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShiftModal(true)} className="btn-primary flex items-center gap-2">
              <i className="fa-solid fa-plus" /> Thêm ca
            </button>
          </div>

          {shifts.length === 0 ? (
            <div className="card p-12 text-center">
              <i className="fa-solid fa-clock text-4xl text-gray-300 mb-3 block" />
              <p className="text-gray-500">Chưa có ca làm việc nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shifts.map((s) => (
                <div key={s.id} className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">{s.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-calendar w-4 text-primary-500" />
                      <span>{fmt(s.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-clock w-4 text-primary-500" />
                      <span>{fmtTime(s.startTime)} - {fmtTime(s.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-users w-4 text-primary-500" />
                      <span>{s.currentVolunteers || 0} / {s.maxVolunteers} tình nguyện viên</span>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((s.currentVolunteers || 0) / s.maxVolunteers) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Modal isOpen={shiftModal} onClose={() => setShiftModal(false)} title="Thêm ca làm việc" size="md">
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ca *</label>
                <input type="text" value={shiftForm.name} onChange={(e) => setShiftForm((f) => ({ ...f, name: e.target.value }))} required className="input-field" placeholder="VD: Ca sáng" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu *</label>
                  <input type="datetime-local" value={shiftForm.startTime} onChange={(e) => setShiftForm((f) => ({ ...f, startTime: e.target.value }))} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc *</label>
                  <input type="datetime-local" value={shiftForm.endTime} onChange={(e) => setShiftForm((f) => ({ ...f, endTime: e.target.value }))} required className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tối đa *</label>
                <input type="number" min={1} value={shiftForm.maxVolunteers} onChange={(e) => setShiftForm((f) => ({ ...f, maxVolunteers: e.target.value }))} required className="input-field" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShiftModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={shiftSaving} className="btn-primary flex items-center gap-2">
                  {shiftSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Tạo ca
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {tab === 'checkin' && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="card p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-qrcode text-primary-600 text-2xl" />
              </div>
              <h2 className="font-semibold text-gray-900">Điểm danh tình nguyện viên</h2>
              <p className="text-sm text-gray-500 mt-1">Chọn người đã được xác nhận, rồi nhập mã QR của sự kiện để ghi nhận tham gia</p>
            </div>

            <form onSubmit={handleCheckin} className="space-y-3">
              {event?.qrCode && (
                <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary-600">Mã QR sự kiện hiện tại</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-primary-700">{event.qrCode}</p>
                </div>
              )}

              <input type="text" value={checkinCode} onChange={(e) => setCheckinCode(e.target.value)} placeholder="Nhập mã QR của sự kiện..." className="input-field text-center font-mono text-lg tracking-widest" autoFocus />

              <select value={selectedCheckinRegId} onChange={(e) => setSelectedCheckinRegId(e.target.value)} className="input-field">
                <option value="">Chọn tình nguyện viên cần điểm danh</option>
                {confirmed.filter((r) => !r.isAttended).map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.user?.name || r.user?.userName || `User #${r.userId}`)}{r.shift?.name ? ` · ${r.shift.name}` : ''}
                  </option>
                ))}
              </select>

              <button type="submit" disabled={checkinLoading || !checkinCode.trim() || !selectedCheckinRegId} className="btn-primary w-full flex items-center justify-center gap-2">
                {checkinLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check-circle" /> Xác nhận điểm danh
                  </>
                )}
              </button>
            </form>

            {checkinMsg && (
              <div className={`p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2 ${checkinType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <i className={`fa-solid ${checkinType === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`} />
                {checkinText}
              </div>
            )}

            {confirmed.filter((r) => !r.isAttended).length === 0 && (
              <p className="text-xs text-center text-gray-500">
                Hiện không còn tình nguyện viên nào ở trạng thái đã xác nhận và chưa điểm danh.
              </p>
            )}
          </div>

          {attended.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Đã điểm danh ({attended.length})</h3>
              <div className="space-y-2">
                {attended.slice(0, 10).map((r) => (
                  <div key={r.id} className="card p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-check text-primary-600 text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.user?.name || r.user?.userName || `User #${r.userId}`}</p>
                      {r.shift?.name && <p className="text-xs text-primary-600 mt-0.5">Ca: {r.shift.name}</p>}
                    </div>
                    <span className="text-xs text-primary-600 font-medium">{r.volunteerHours}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'report' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Tổng đăng ký', value: registrations.length, icon: 'fa-clipboard-list' },
              { label: 'Tỷ lệ lấp đầy', value: `${fillRate}%`, icon: 'fa-chart-pie' },
              { label: 'Tỷ lệ điểm danh', value: `${attendanceRate}%`, icon: 'fa-user-check' },
              { label: 'Tổng giờ ghi nhận', value: `${totalHours}h`, icon: 'fa-clock' },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <i className={`fa-solid ${item.icon}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Phân bổ trạng thái đăng ký</h3>
            <div className="space-y-3">
              {[
                { label: 'Chờ xác nhận', value: pending.length, color: 'bg-yellow-500' },
                { label: 'Đã xác nhận', value: confirmed.length, color: 'bg-green-500' },
                { label: 'Đã hủy', value: cancelled.length, color: 'bg-red-500' },
                { label: 'Đã điểm danh', value: attended.length, color: 'bg-primary-500' },
              ].map((row) => {
                const pct = registrations.length > 0 ? Math.round((row.value / registrations.length) * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-medium text-gray-900">{row.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {shifts.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Báo cáo theo ca</h3>
              <div className="space-y-2">
                {shifts.map((shift) => {
                  const regsInShift = registrations.filter((r) => r.shift?.id === shift.id || r.shiftId === shift.id);
                  const attendedInShift = regsInShift.filter((r) => r.isAttended);
                  const shiftPct = shift.maxVolunteers > 0 ? Math.round((regsInShift.length / shift.maxVolunteers) * 100) : 0;
                  return (
                    <div key={shift.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{shift.name}</p>
                          <p className="text-xs text-gray-500">{fmtTime(shift.startTime)} - {fmtTime(shift.endTime)}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{regsInShift.length}/{shift.maxVolunteers} đăng ký</p>
                          <p>{attendedInShift.length} điểm danh</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${Math.min(shiftPct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
