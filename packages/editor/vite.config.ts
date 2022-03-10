import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
// import eslintPlugin from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": {},
  },
  plugins: [
    react({
      jsxRuntime: "classic", // TODO: would prefer to move to new jsxRuntime
    }),
    // eslintPlugin(),
  ],
});
