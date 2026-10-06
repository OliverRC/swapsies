// Per-group manifest: installing from a group page opens that group, not the "start a group" page.
export default defineEventHandler((event) => {
  const g = String(getQuery(event).g ?? '')
  const start = /^[a-z0-9]{1,20}$/.test(g) ? `/g/${g}` : '/'
  setHeader(event, 'content-type', 'application/manifest+json')
  return {
    id: start,
    name: 'Swapsies',
    short_name: 'Swapsies',
    description: 'Swap your duplicate stickers with your class.',
    start_url: start,
    scope: '/',
    display: 'standalone',
    background_color: '#fff8ef',
    theme_color: '#14b8a6',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
})
