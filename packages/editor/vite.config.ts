import react from "@vitejs/plugin-react";
import history from "connect-history-api-fallback";
import { webpackStats } from "rollup-plugin-webpack-stats";
import { ViteDevServer } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

// solves issue that vite dev server doesn't redirect urls with a "." (such as docs/xxx.md) to the SPA fallback. See https://github.com/vitejs/vite/issues/2190
// code from https://github.com/ivesia/vite-plugin-rewrite-all/blob/master/src/index.ts
function redirectAll() {
  return {
    name: "rewrite-all",
    configureServer(server: ViteDevServer) {
      return () => {
        const handler = history({
          disableDotRule: true,
          rewrites: [{ from: /\/$/, to: () => "/index.html" }],
        });

        server.middlewares.use((req, res, next) => {
          handler(req, res, next);
        });
      };
    },
  };
}

const pwaOptions: Partial<VitePWAOptions> = {
  // mode: "development",
  // base: "/",
  includeAssets: ["favicon.svg"],
  manifest: {
    name: "TypeCell",
    short_name: "TypeCell",
    theme_color: "#ffffff",
    icons: [
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
  devOptions: {
    enabled: true,
    /* when using generateSW the PWA plugin will switch to classic */
    type: "module",
    navigateFallback: "index.html",
  },
  filename: "sw-tc.ts",
  srcDir: "src",
  strategies: "injectManifest",
  injectManifest: {
    maximumFileSizeToCacheInBytes: 10000000,
    globPatterns: ["**/*.{js,css,html,svg,png,ico,gif,woff,woff2}"],
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
  },
  define: {
    // Node.js global to browser globalThis
    // global: "globalThis", // breaks some modules work because of https://github.com/vitejs/vite/issues/6295, done in index.tsx instead
    // process & buffer are added to global scope in index.host.tsx
  },
  plugins: [react(), webpackStats(), VitePWA(pwaOptions)],
  resolve: {
    // alias: {
    //   buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
    //   process: "rollup-plugin-node-polyfills/polyfills/process-es6",
    // },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        // NodeGlobalsPolyfillPlugin({
        //   process: true,
        //   buffer: true,
        // }) as any,
        // NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      // Enable rollup polyfills plugin
      // used during production bundling
      plugins: [],
    },
  },
  test: {
    exclude: [
      "**/end-to-end/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    deps: {
      inline: ["monaco-editor"],
    },
    setupFiles: "src/setupTests.ts",
  },
});
