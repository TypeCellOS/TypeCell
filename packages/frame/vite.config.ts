import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
