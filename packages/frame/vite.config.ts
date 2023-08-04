import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

import pkg from "./package.json";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "typecell-frame",
      fileName: "typecell-frame",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        ...Object.keys({
          ...pkg.dependencies,
          // ...pkg.peerDependencies,
          ...pkg.devDependencies,
        }),
        "prettier/parser-postcss",
        "prettier/parser-typescript",
        "prettier/standalone",
        "react/jsx-runtime",
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
