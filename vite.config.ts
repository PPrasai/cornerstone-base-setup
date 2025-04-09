import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), viteCommonjs()],
    optimizeDeps: {
        exclude: ['@cornerstonejs/dicom-image-loader'],
        include: ['dicom-parser'],
    },
    test: {
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
        },
    },
    worker: {
        format: 'es',
        rollupOptions: {
            external: ['@icr/polyseg-wasm'],
        },
    },
} as UserConfig);
