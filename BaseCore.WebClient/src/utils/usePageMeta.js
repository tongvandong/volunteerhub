import { useEffect } from 'react';

/**
 * Cap nhat <title> va cac the Open Graph / Twitter Card theo tung trang.
 *
 * Luu y: day la SPA, khong SSR. Cac crawler khong chay JavaScript nhu Facebook
 * hoac Zalo chi doc duoc the OG tinh trong index.html. Muon chia se dung anh va
 * tieu de rieng tung su kien thi can prerender/SSR o phia server.
 */
const DEFAULTS = {
  title: 'VolunteerHub - Cong su kien tinh nguyen',
  description:
    'Nen tang ket noi tinh nguyen vien, to chuc va nha tai tro mot cach minh bach - dung nguoi, dung viec, dung ky nang.',
  image: '/og-default.png',
};

function upsertMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function applyMeta({ title, description, image, url }) {
  document.title = title;
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:url', url);
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image);
}

export default function usePageMeta(meta = {}) {
  const { title, description, image } = meta;

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const toAbs = (src) => (!src ? `${origin}${DEFAULTS.image}` : src.startsWith('http') ? src : `${origin}${src}`);

    applyMeta({
      title: title ? `${title} - VolunteerHub` : DEFAULTS.title,
      description: description || DEFAULTS.description,
      image: toAbs(image),
      url: window.location.href,
    });

    return () => {
      applyMeta({
        title: DEFAULTS.title,
        description: DEFAULTS.description,
        image: `${origin}${DEFAULTS.image}`,
        url: origin,
      });
    };
  }, [title, description, image]);
}
