import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const apiProxy = {
    '/api': {
      target: 'http://127.0.0.1:3301',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  };

  return {
    base: env.VITE_BASE_PATH || './',
    server: {
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: '护航 · 育儿与产程护航助手',
          short_name: '护航助手',
          description: '家庭急诊急救、精选育儿知识库、产程陪产与医护交接工具',
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
          navigateFallbackDenylist: [/\/api\//],
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
