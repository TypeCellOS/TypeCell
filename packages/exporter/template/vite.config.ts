import { resolve } from "path";
import { defineConfig } from "vitest/config";
// https://vitejs.dev/config/
export default defineConfig({
  test: {
    exclude: [
      "**/end-to-end/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "PACKAGENAME",
    },
  },
});
