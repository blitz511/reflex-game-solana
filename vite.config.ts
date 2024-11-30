import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util'
    }
  },
  define: {
    'global': 'globalThis',
    'process.env': process.env
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    include: [
      '@project-serum/anchor',
      '@solana/web3.js',
      'buffer',
      'process/browser',
      'util'
    ]
  },
  build: {
    rollupOptions: {
      external: ['fsevents'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'solana-vendor': [
            '@solana/web3.js',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets'
          ]
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});