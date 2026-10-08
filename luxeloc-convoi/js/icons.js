// Network marks for the end card (simplified, 24×24 grid) and a map pin.
const P = {
  snap: '<path fill="#fff" d="M12 2.6c3 0 5.2 2.2 5.2 5.3v2.1c.5.3 1.2.2 1.7 0 .6-.2 1 .5.5.9-.5.4-1.4.6-1.9.9.6 1.6 1.8 2.8 3.4 3.3.5.2.4.8-.1 1-.8.3-1.7.4-2 .8-.2.4-.1 1-.6 1.1-.6.1-1.4-.2-2.3 0-1 .2-1.8 1.5-3.9 1.5s-2.9-1.3-3.9-1.5c-.9-.2-1.7.1-2.3 0-.5-.1-.4-.7-.6-1.1-.3-.4-1.2-.5-2-.8-.5-.2-.6-.8-.1-1 1.6-.5 2.8-1.7 3.4-3.3-.5-.3-1.4-.5-1.9-.9-.5-.4-.1-1.1.5-.9.5.2 1.2.3 1.7 0V7.9c0-3.1 2.2-5.3 5.2-5.3z"/>',
  tiktok: '<path fill="#fff" d="M16.4 3c.4 2.2 1.8 3.7 4 4v3.1c-1.5 0-2.9-.4-4-1.2v6.6c0 3.3-2.6 5.5-5.6 5.5s-5.4-2.2-5.4-5.4c0-3.3 2.9-5.7 6.3-5.3v3.2c-1.5-.4-3 .6-3 2.1 0 1.3 1 2.3 2.3 2.3 1.4 0 2.3-1 2.3-2.5V3h3.1z"/>',
  insta: '<g fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/></g><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/>',
  pin: '<g fill="none" stroke="#d9b25f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.5"/></g>',
};
export const icon = (name, size = 40) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${P[name]}</svg>`;
