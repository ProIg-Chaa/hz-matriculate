import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://hz.startyi.com",
  integrations: [sitemap()]
});
