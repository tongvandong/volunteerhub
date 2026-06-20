import { ORIGIN } from '../api/client';

// Ảnh sự kiện: trả về source cho <Image>, hoặc null nếu không có ảnh.
export function eventImageSource(event) {
  const url = event?.imageUrl;
  if (!url) return null;
  return { uri: url.startsWith('http') ? url : `${ORIGIN}${url}` };
}

// Cover dự phòng khi sự kiện không có ảnh: màu pastel + icon xoay vòng theo categoryId.
const FALLBACKS = [
  { bg: '#dbe7fb', fg: '#1b61c9', icon: 'leaf' },
  { bg: '#fdeee8', fg: '#f0612f', icon: 'school' },
  { bg: '#e3f3ea', fg: '#2e7d52', icon: 'medkit' },
  { bg: '#f7edd8', fg: '#b8860b', icon: 'people' },
  { bg: '#efe6f7', fg: '#7c4dbe', icon: 'home' },
  { bg: '#fdeaf0', fg: '#c2185b', icon: 'happy' },
  { bg: '#e0f2f1', fg: '#00796b', icon: 'heart' },
  { bg: '#fff3e0', fg: '#e65100', icon: 'paw' },
];

export function eventFallback(event) {
  const key = Math.abs((event?.categoryId ?? event?.id ?? 0)) % FALLBACKS.length;
  return FALLBACKS[key];
}
