import { readFile } from "node:fs/promises";
import { currentBio } from "../src/app/bio-data.ts";

const portfolio = JSON.parse(await readFile(new URL("../src/app/published-portfolio.json", import.meta.url)));
const bio = currentBio(JSON.parse(await readFile(new URL("../src/app/published-bio.json", import.meta.url))));
const asSql = (value) => {
  const ascii = JSON.stringify(value).replace(/[^\x00-\x7f]/g, (char) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0"));
  return "'" + ascii.replaceAll("'", "''") + "'::jsonb";
};

process.stdout.write(`insert into public.published_pages (page, content)
values ('portfolio', ${asSql(portfolio)}), ('bio', ${asSql(bio)})
on conflict (page) do nothing;\n`);
