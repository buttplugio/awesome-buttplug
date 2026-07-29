import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://awesome.buttplug.io",
  output: "static",
  integrations: [preact(), pagefind()],
});
