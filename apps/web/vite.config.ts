import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react-vendor";
          if (/node_modules\/(@tiptap|prosemirror-|tiptap-markdown)\//.test(id)) return "editor";
          if (
            /node_modules\/(@base-ui|lucide-react|sonner|next-themes|clsx|tailwind-merge|class-variance-authority)\//.test(
              id,
            )
          )
            return "ui-vendor";
        },
      },
    },
  },
});
