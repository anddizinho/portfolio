import { cp, mkdir, writeFile } from "node:fs/promises";

await mkdir("dist/server", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await cp("worker/index.mjs", "dist/server/index.js");
await writeFile("dist/server/wrangler.json", JSON.stringify({
  main: "index.js",
  compatibility_date: "2026-11-17",
  assets: { directory: "../client", binding: "ASSETS", html_handling: "auto-trailing-slash" },
}));
