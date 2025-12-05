import { ssgAdapter } from "@qwik.dev/router/adapters/static/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      // Enables Server-Side Rendering (SSR) during the build process
      // This pre-renders pages at build time for better SEO and initial load performance
      ssr: true,
      
      // Keep output in standard dist directory
      outDir: "../../dist",

      rollupOptions: {
        // Specifies the entry point for the build
        // @qwik-city-plan is a special Qwik City module that contains routing information
        input: ["@qwik-city-plan"],
      },
    },

    plugins: [
      // Static Site Generation adapter that pre-renders all pages
      ssgAdapter({
        // The production URL where the site will be hosted
        // This is used to generate absolute URLs for links, SEO metadata, etc.
        origin: "https://loganpowell.github.io",
      }),
    ],
  };
});
