import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const githubPagesBase = process.env.GITHUB_ACTIONS && repository && !repository.endsWith(".github.io")
  ? `/${repository}/`
  : "/";

export default defineConfig({
  base: githubPagesBase,
  plugins: [react()],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});
