import react from "@vitejs/plugin-react";
import history from "connect-history-api-fallback";
import path from "path";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { webpackStats } from "rollup-plugin-webpack-stats";
import { ViteDevServer } from "vite";
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

// https://vitejs.dev/config/
export default defineConfig((conf) => ({
  server: {
    host: "localhost",
  },
  define: {
    // Node.js global to browser globalThis
    // global: "globalThis", // breaks some modules work because of https://github.com/vitejs/vite/issues/6295, done in index.tsx instead
    // process & buffer are added to global scope in index.host.tsx
  },
  plugins: [react(), redirectAll(), webpackStats()],
  resolve: {
    // alias: {
    //   buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
    //   process: "rollup-plugin-node-polyfills/polyfills/process-es6",
    // },

    alias:
      conf.command === "build"
        ? ({
            // "@typecell-org/frame": path.resolve(__dirname, "../frame/src/"),
          } as Record<string, string>)
        : ({
            // load live from sources with live reload working
            "@typecell-org/frame": path.resolve(__dirname, "../frame/src/"),
            "@typecell-org/util": path.resolve(__dirname, "../util/src/"),
          } as Record<string, string>),
  },
  optimizeDeps: {
    exclude: ["monaco-editor"],
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
      plugins: [nodePolyfills()],
      external(source, importer, isResolved) {
        if (importer?.includes("monaco-editor/esm/vs/basic-languages/monaco.contribution.js")) {
          if (!source.match(/editor\.api|typescript|css|html|javascript|markdown/)) {
            return true;
          }
        }
        return false;
      },
    },
    sourcemap: true,
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
}));
