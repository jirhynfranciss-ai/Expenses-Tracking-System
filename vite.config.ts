import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client',
      '@supabase/supabase-js',
      'react-hot-toast',
      'lucide-react',
      'recharts',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase':     ['@supabase/supabase-js'],
          'charts':       ['recharts'],
          'lucide':       ['lucide-react'],
        },
      },
    },
  },
});
