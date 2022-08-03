// import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": {},
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [
        // NodeGlobalsPolyfillPlugin({
        //   buffer: true,
        // }),
      ],
    },
  },
});
