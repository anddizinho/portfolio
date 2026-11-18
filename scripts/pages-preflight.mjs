const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url ?? "") || !/^sb_publishable_/.test(key ?? "")) {
  throw new Error("Set the public Supabase URL and publishable key in Pages repository variables.");
}
const headers = { apikey: key };
const [pages, auth] = await Promise.all([
  fetch(`${url}/rest/v1/published_pages?select=page`, { headers }),
  fetch(`${url}/auth/v1/settings`, { headers }),
]);
if (!pages.ok || !auth.ok) throw new Error("Supabase Pages preflight failed.");
const names = (await pages.json()).map((row) => row.page).sort();
if (names.join(",") !== "bio,portfolio" || !(await auth.json()).external?.github) {
  throw new Error("Import both pages and enable GitHub sign-in before deploying.");
}
