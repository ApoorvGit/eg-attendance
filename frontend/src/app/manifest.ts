import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Attendance Planner',
    short_name: 'Attendance',
    description: 'Office attendance compliance tracker and planner',
    start_url: '/',
    // No browser chrome once added to the home screen.
    display: 'standalone',
    orientation: 'portrait',
    // Matches --background in each theme so there's no white flash while launching.
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // Android crops icons to a circle/squircle; the maskable variant has the extra
      // padding needed so the glyph survives that crop.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
