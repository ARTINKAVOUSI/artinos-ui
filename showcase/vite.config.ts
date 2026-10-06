import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The showcase consumes ../src (the package) exactly as a host app would. dedupe makes the
// package's bare `react` imports resolve from this project's node_modules; singlefile
// inlines everything so dist/index.html opens straight from disk.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { fs: { allow: ['..'] } },
});
