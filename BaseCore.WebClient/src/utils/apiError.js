export function getApiErrorMessage(error, fallback = 'Thao tác thất bại. Vui lòng thử lại.') {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.title) {
    return data.title;
  }

  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat().find(Boolean);
    if (first) return first;
  }

  if (error?.message) {
    if (error.message === 'Network Error') {
      return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.';
    }
    return error.message;
  }

  return fallback;
}
