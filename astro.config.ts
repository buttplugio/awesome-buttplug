import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import pagefind from "astro-pagefind";

export default defineConfig({
  output: "static",
  integrations: [preact(), pagefind()],
});
