import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],

  // build: {
  //   lib: {
  //     entry: resolve(__dirname, "src/main.ts"),
  //     name: "PACKAGENAME",
  //   },
  // },
});
