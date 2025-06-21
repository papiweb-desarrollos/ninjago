import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: mode === 'production' ? '/ninjago/' : '/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      publicDir: 'public',
      server: {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        fs: {
          allow: ['..']
        }
      },
      css: {
        postcss: './postcss.config.js'
      },
      build: {
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: undefined,
            assetFileNames: 'assets/[name]-[hash][extname]'
          }
        }
      }
    };
});
