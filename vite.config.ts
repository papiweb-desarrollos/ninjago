import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    // Carga las variables de entorno (ej. desde un archivo .env)
    const env = loadEnv(mode, '.', '');

    return {
        // Añade el plugin de React, que es esencial para tu proyecto
        plugins: [react()],

        // Esta es la forma correcta de establecer la base. 
        // Usa '/ninjago/' para producción (GitHub Pages) y '/' para desarrollo local.
        base: mode === 'production' ? '/ninjago/' : '/',

        // Define variables globales para usar en tu código
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },

        // Configura alias para las rutas de importación
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },

        // Tus otras configuraciones personalizadas
        publicDir: 'public',
        css: {
            postcss: './postcss.config.js'
        },
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            rollupOptions: {
                output: {
                    manualChunks: undefined,
                }
            }
        }
    };
});
