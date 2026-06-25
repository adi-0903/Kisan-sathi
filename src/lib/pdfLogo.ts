export function getLogoPngBase64(): Promise<string> {
  return new Promise((resolve) => {
    const svgString = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" width="120" height="120" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop stop-color="#065F46" />
      <stop offset="1" stop-color="#022C22" />
    </linearGradient>
    <linearGradient id="sunGrad" x1="60" y1="10" x2="60" y2="70" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FDE047" />
      <stop offset="1" stop-color="#F59E0B" />
    </linearGradient>
    <linearGradient id="leafLeft" x1="20" y1="40" x2="60" y2="100" gradientUnits="userSpaceOnUse">
      <stop stop-color="#34D399" />
      <stop offset="1" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="leafRight" x1="100" y1="30" x2="50" y2="100" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6EE7B7" />
      <stop offset="1" stop-color="#10B981" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="34" fill="url(#bgGrad)" />
  <circle cx="60" cy="48" r="26" fill="url(#sunGrad)" />
  <path d="M 10 90 Q 60 75 110 90" stroke="#10B981" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.4" />
  <path d="M 20 102 Q 60 90 100 102" stroke="#047857" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6" />
  <path d="M60 100 C 60 100, 110 75, 88 28 C 88 28, 55 55, 60 100 Z" fill="url(#leafRight)" />
  <path d="M60 100 C 60 100, 20 80, 32 38 C 32 38, 55 65, 60 100 Z" fill="url(#leafLeft)" />
  <path d="M60 100 L60 62" stroke="#022C22" stroke-width="3.5" stroke-linecap="round" fill="none" />
  <circle cx="60" cy="58" r="6" fill="#34D399" stroke="#022C22" stroke-width="2.5" />
  <circle cx="60" cy="58" r="2" fill="#FFFFFF" />
  <circle cx="85" cy="22" r="3" fill="#FDE047" />
  <path d="M85 15 L85 29 M78 22 L92 22" stroke="#FDE047" stroke-width="1.5" fill="none" opacity="0.8" />
  <circle cx="36" cy="28" r="2.5" fill="#6EE7B7" />
  <path d="M36 23 L36 33 M31 28 L41 28" stroke="#6EE7B7" stroke-width="1" fill="none" opacity="0.6" />
</svg>`;

    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300; // Render larger for better resolution in PDF
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2.5, 2.5); // scale up properly
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
  });
}
