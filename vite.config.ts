/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
import { defineConfig, type UserConfig } from "vite";
import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(({ command, mode }): UserConfig => {
  return {
    base: "/qwik-lens/",
    plugins: [qwikRouter(), qwikVite(), tsconfigPaths({ root: "." })],
    resolve: {
      dedupe: ["@qwik.dev/core", "@qwik.dev/router"],
    },
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      exclude: ["@qwik.dev/core", "@qwik.dev/router"],
    },

    // SSR configuration
    ssr: {
      noExternal: [
        "@qwik.dev/core",
        "@qwik.dev/router",
        "@thi.ng/api",
        "@thi.ng/equiv",
        "@thi.ng/paths",
      ],
    },
    server: {
      headers: {
        // Don't cache the server response in dev mode
        "Cache-Control": "public, max-age=0",
      },
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600",
      },
    },
  };
});
