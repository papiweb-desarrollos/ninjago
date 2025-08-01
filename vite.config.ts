import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    // Carga variables de entorno (si las usás)
    const env = loadEnv(mode, process.cwd());

    return {
        plugins: [react()],

        // Base correcto para GitHub Pages (ajusta a tu repo)
        base: mode === 'production' ? '/ninjago/' : '/',

        define: {
            // Define variables de entorno solo si las usás
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },

        resolve: {
            alias: {
                // Usa @ para importar desde la raíz del proyecto
                '@': path.resolve(__dirname, '.'),
            }
        },

        publicDir: 'public',

        css: {
            postcss: './postcss.config.js'
        },

        build: {
            outDir: 'dist',
            assetsDir: 'assets',
        }
    };
});
