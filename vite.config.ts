import { defineConfig } from "vite";

// Relative asset URLs make the same build work on both:
// - https://<user>.github.io/
// - https://<user>.github.io/<repository>/
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
