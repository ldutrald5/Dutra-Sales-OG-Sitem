const paths = {
  route: '<path d="M7 19 11 5m2 14 4-14M4 15h4m7-6h5"/>',
  home: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-12 0v11"/>',
  clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h6"/>',
  fuel: '<path d="M3 21h12M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M5 11h9m0 2h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-5a4 4 0 0 0-1-3l-3-3"/>',
  tire: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5"/>',
  gauge: '<path d="M4 18a9 9 0 1 1 16 0H4Zm8-4 4-5m-7 4h.01m3-6h.01m6 6h.01"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/>',
  tool: '<path d="m14 7 3 3 4-4a6 6 0 0 1-8 8l-6 6a2 2 0 0 1-3-3l6-6a6 6 0 0 1 8-8Z"/>',
  chart: '<path d="M4 4v16h16M8 16v-4m5 4V9m5 7V5"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8m-8 5h1m6 0h1m-8 4h1m6 0h1"/>',
  shield: '<path d="M12 22s7-3 7-9V5l-7-3-7 3v8c0 6 7 9 7 9Z"/><path d="m9 12 2 2 4-4"/>',
  pen: '<path d="m14 6 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z"/>',
  expand: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>',
  collapse: '<path d="M4 8h4V4m12 4h-4V4M8 20v-4H4m12 4v-4h4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  left: '<path d="m11 6-6 6 6 6m-6-6h14"/>',
  right: '<path d="m13 6 6 6-6 6m6-6H5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  play: '<path d="m9 5 11 7-11 7V5Z"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 7m-1-7V4m0 6h6"/>',
  external: '<path d="M13 5h6v6m0-6-8 8m6 0v6H5V7h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};

export function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
