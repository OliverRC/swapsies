export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  modules: ['nuxt-auth-utils', 'nitro-cloudflare-dev'],
  nitro: { preset: 'cloudflare_module' },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    superAdminKey: '', // NUXT_SUPER_ADMIN_KEY
    session: { maxAge: 60 * 60 * 24 * 90 }, // whole promo
  },
  app: {
    head: {
      title: 'Swapsies',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Swap your duplicate stickers with your class.' },
        { name: 'theme-color', content: '#14b8a6' },
      ],
      link: [
        { rel: 'icon', href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314b8a6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m17 2 4 4-4 4'/><path d='M3 11v-1a4 4 0 0 1 4-4h14'/><path d='m7 22-4-4 4-4'/><path d='M21 13v1a4 4 0 0 1-4 4H3'/></svg>" },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap' },
      ],
    },
  },
})
