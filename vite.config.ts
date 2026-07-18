import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
  const pagesBuild = mode === 'pages';
  const appVersion = process.env.npm_package_version ?? '1.0.0';

  return {
    plugins: [react()],
    base: pagesBuild ? '/flash-words/' : './',
    build: {
      outDir: pagesBuild ? 'docs' : 'dist',
    },
    define: {
      __APP_VERSION_LABEL__: JSON.stringify(`v${appVersion}`),
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      exclude: ['./src/tests/e2e/**', './node_modules/**'],
    },
  };
});
