import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import type { Plugin } from "vite";

// Rename index.admin.html → index.html in the output so Netlify serves it correctly
function renameAdminHtml(): Plugin {
  return {
    name: "rename-admin-html",
    generateBundle(_, bundle) {
      for (const key of Object.keys(bundle)) {
        const chunk = bundle[key] as { fileName: string; type: string };
        if (chunk.fileName === "index.admin.html") {
          chunk.fileName = "index.html";
          bundle["index.html"] = bundle[key];
          delete bundle[key];
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), renameAdminHtml()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.admin.html"),
    },
  },
});
