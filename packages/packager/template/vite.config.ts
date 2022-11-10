import react from "@vitejs/plugin-react";
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

  plugins: [react()],

  // build: {
  //   lib: {
  //     entry: resolve(__dirname, "src/main.ts"),
  //     name: "PACKAGENAME",
  //   },
  // },
});
