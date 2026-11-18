import { writeFile, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
if (prefix && !/^\/[a-z0-9._-]+$/i.test(prefix)) throw new Error("Invalid Pages base path.");
for (const file of await readdir("out/_next", { recursive: true })) {
  if (!file.endsWith(".css")) continue;
  const path = join("out/_next", file);
  const css = await readFile(path, "utf-8");
  await writeFile(path, css.replace(/(url\(["']?)\/sites\//g, `$1${prefix}/sites/`));
}
await writeFile("out/.nojekyll", "");
