export function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export function formatDateTime(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const STATUS_LABEL = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Completed: 'Đã hoàn thành',
  Rejected: 'Bị từ chối',
  Cancelled: 'Đã huỷ',
  Confirmed: 'Đã xác nhận',
};

export function regStatusLabel(s) {
  return STATUS_LABEL[s] || s || '';
}
