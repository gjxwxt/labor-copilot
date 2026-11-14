import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  return {
    base: env.VITE_BASE_PATH || './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: '护航 · 产程陪产助手',
          short_name: '产程陪产',
          description: '零账号、弱网离线可用、单手友好的产房副驾驶与医护交接工具',
          theme_color: '#0b0f14',
          background_color: '#0b0f14',
          display: 'standalone',
          lang: 'zh-CN',
          start_url: './',
          scope: './',
          icons: [
            {
              src: './icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        },
      }),
    ],
    test: {
      environment: 'node',
      globals: true,
      include: ['src/**/*.test.ts'],
    },
  };
});
