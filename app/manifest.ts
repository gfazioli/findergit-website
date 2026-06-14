import type { MetadataRoute } from 'next';
import config from '@/config';

/**
 * Web app manifest. Adds the mobile/PWA install signal that was missing and
 * puts the previously-orphaned `android-chrome-*` icons to use. `theme_color`
 * matches the app's brand blue; `background_color` matches the site's default
 * dark scheme.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FinderGit — Native macOS File Browser with Git Intelligence',
    short_name: 'FinderGit',
    description: config.metadata.description,
    start_url: '/',
    display: 'standalone',
    theme_color: '#228be6',
    background_color: '#111111',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
