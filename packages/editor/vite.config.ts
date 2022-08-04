import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import react from "@vitejs/plugin-react";
import history from "connect-history-api-fallback";
import nodePolyfills from "rollup-plugin-polyfill-node";
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
          handler(req as Request, res as Response, next);
        });
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // "process.env": {},
    // Node.js global to browser globalThis
    // global: "globalThis",
  },
  plugins: [
    react({
      jsxRuntime: "classic", // TODO: would prefer to move to new jsxRuntime, but doesn't seem compatible with atlaskit
    }),
    redirectAll(),
  ],
  resolve: {
    alias: {
      buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
      process: "rollup-plugin-node-polyfills/polyfills/process-es6",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }) as any,
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      // Enable rollup polyfills plugin
      // used during production bundling
      plugins: [nodePolyfills()],
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
