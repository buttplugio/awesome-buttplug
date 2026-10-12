import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://awesome.buttplug.io",
  output: "static",
  trailingSlash: "always",
  integrations: [preact(), sitemap(), pagefind()],
});
