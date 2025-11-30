import { staticAdapter } from "@qwik.dev/router/adapters/static/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.ssr.tsx", "@qwik-router-config"],
      },
    },
    plugins: [
      staticAdapter({
        origin: "https://your-domain.com", // Update with your actual domain
      }),
    ],
  };
});
