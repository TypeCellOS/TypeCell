// import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": {},
  },
  plugins: [
    react({
      jsxRuntime: "classic", // TODO: would prefer to move to new jsxRuntime, but doesn't seem compatible with atlaskit
    }),
  ],
  build: {
    rollupOptions: {
      plugins: [
        // NodeGlobalsPolyfillPlugin({
        //   buffer: true,
        // }),
      ],
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
