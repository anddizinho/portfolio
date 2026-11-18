const encoder = new TextEncoder();
const contentKey = "portfolio/content.json";
const bioKey = "bio/content.json";
const cookieName = "__Host-portfolio_admin";
const sectionIds = ["inicio", "projetos", "competencias", "trajetoria", "clientes", "contato"];
const mediaTypes = new Map(Object.entries({
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm",
}));
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const json = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...headers, ...extra } });
const hex = (bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
const hash = async (value) => hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));

async function sessionToken(payload, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function authenticated(request, env) {
  if (!env.ADMIN_SESSION_KEY) return false;
  const value = request.headers.get("Cookie")?.split("; ").find((cookie) => cookie.startsWith(cookieName + "="))?.split("=")[1] ?? "";
  const [expires, nonce, signature, extra] = value.split(".");
  if (extra || !/^[0-9]{13}$/.test(expires) || Number(expires) <= Date.now() || !/^[a-f0-9-]{36}$/.test(nonce ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? "")) return false;
  return equal(signature, await sessionToken(expires + "." + nonce, env.ADMIN_SESSION_KEY));
}

const string = (value) => typeof value === "string" && value.length <= 12000;
const nonempty = (value) => string(value) && value.trim().length > 0;
const fields = (value, keys) => value && keys.every((key) => string(value[key]));
const color = (value) => typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value);
const safeUrl = (value) => typeof value === "string" && (value.startsWith("/") && !/^\/[/\\]/.test(value) && !value.includes("\\") || /^https:\/\/[^\s]+$/i.test(value));
const optionalUrl = (value) => value === undefined || value === "" || safeUrl(value);
const image = (value) => value && safeUrl(value.src) && string(value.alt);
const list = (value, predicate, min = 0) => Array.isArray(value) && value.length >= min && value.length <= 100 && value.every(predicate);
function validBio(data) {
  return fields(data, ["name","tagline","description","location","email","backgroundVideo","backgroundPoster"]) && nonempty(data.name)
    && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)
    && optionalUrl(data.backgroundVideo) && optionalUrl(data.backgroundPoster)
    && list(data.socials, (social) => fields(social, ["label","url"]) && nonempty(social.label) && optionalUrl(social.url))
    && list(data.releases, (release) => fields(release, ["id","badge","caption","title","image","alt","video","href","linkText"])
      && /^[a-z0-9-]+$/.test(release.id) && typeof release.showTitle === "boolean"
      && [release.image, release.video, release.href].every(optionalUrl)
      && Boolean(release.image || release.video || release.href))
    && new Set(data.releases.map((release) => release.id)).size === data.releases.length;
}
const textKeys = ["portfolio","directionMark","directionStart","directionEnd","splitWord","introStatement","explore","moreWork","onBehance","creation","artificialIntelligence","clientsIntro","contactIntro","greeting","emailDisplay","copied","availability","booking","projectLink","projectDetail","filmLink","instagram","linkedin","behance"];
function valid(data) {
  if (!data || !fields(data.text, textKeys) || !safeUrl(data.text.logo)) return false;
  if (data.palette && !["background", "titleColor", "subtitleColor"].every((key) => color(data.palette[key]))) return false;
  if (!fields(data.profile, ["name","email","location","intro"]) || !safeUrl(data.profile.linkedin)
    || !["instagram","behance","booking","logoVideo"].every((key) => optionalUrl(data.profile[key]))) return false;
  if (!list(data.sections, (s) => fields(s, ["id","title","subtitle","label"]) && sectionIds.includes(s.id)
      && color(s.background) && color(s.titleColor) && color(s.subtitleColor), sectionIds.length)
    || data.sections.length !== sectionIds.length || new Set(data.sections.map((s) => s.id)).size !== sectionIds.length) return false;
  const frame = (f) => f && nonempty(f.label) && image(f.image) && optionalUrl(f.video) &&
    (!f.companion || ["molico","cafe","tokstok"].includes(f.companion.theme)
      && string(f.companion.title) && (!f.companion.image || image(f.companion.image)));
  return list(data.projects, (p) => fields(p, ["id","number","title","featuredLabel","summary","area"])
      && /^[a-z0-9-]+$/.test(p.id) && !sectionIds.includes(p.id) && optionalUrl(p.filmUrl) && list(p.frames, frame, 1), 1)
    && new Set(data.projects.map((p) => p.id)).size === data.projects.length
    && list(data.skills, (value) => fields(value, ["title","description"]) && Number.isInteger(value.icon) && value.icon >= 0 && value.icon < 4)
    && list(data.aiSkills, string)
    && list(data.experience, (value) => fields(value, ["company","role","period"]))
    && list(data.brands, (value) => fields(value, ["brand","role"]));
}

function cookie(payload, seconds) {
  return { "Set-Cookie": cookieName + "=" + payload + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + seconds };
}

async function login(request, env) {
  if (!env.ADMIN_LOGIN_HASH || !env.ADMIN_SESSION_KEY) return json({ error: "Login indisponível." }, 503);
  const data = await request.json();
  if (!string(data?.user) || !string(data?.password) || data.user.length > 250 || data.password.length > 250) return json({ error: "Credenciais inválidas." }, 401);
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const attemptKey = "portfolio/attempts/" + await hash(ip + env.ADMIN_SESSION_KEY);
  const attempts = (await (await env.BUCKET.get(attemptKey))?.json()) ?? { count: 0, until: 0 };
  const now = Date.now();
  if (attempts.until > now && attempts.count >= 8) return json({ error: "Muitas tentativas. Tente novamente em 15 minutos." }, 429);
  if (!equal(await hash(data.user + "\n" + data.password), env.ADMIN_LOGIN_HASH)) {
    await env.BUCKET.put(attemptKey, JSON.stringify({ count: attempts.until > now ? attempts.count + 1 : 1, until: now + 900000 }));
    return json({ error: "Credenciais inválidas." }, 401);
  }

  await env.BUCKET.delete(attemptKey);
  const expires = now + 8 * 3600000;
  const payload = expires + "." + crypto.randomUUID();
  return json({ ok: true }, 200, cookie(payload + "." + await sessionToken(payload, env.ADMIN_SESSION_KEY), 8 * 3600));
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (!path.startsWith("/api/") && !path.startsWith("/portfolio-media/")) return env.ASSETS.fetch(request);
  if (path.startsWith("/portfolio-media/") && ["GET","HEAD"].includes(method)) {
    const id = path.slice("/portfolio-media/".length);
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp|avif|gif|mp4|webm)$/.test(id)) return new Response(null, { status: 404 });
    const key = "portfolio/media/" + id;
    const media = method === "HEAD" ? await env.BUCKET.head(key) : await env.BUCKET.get(key, { range: request.headers });
    if (!media) return new Response(null, { status: 404 });
    const h = new Headers({ "Cache-Control": "public,max-age=31536000,immutable", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" });
    media.writeHttpMetadata(h);
    const range = request.headers.has("Range") && media.range;
    const start = range?.offset ?? (range?.suffix ? Math.max(0, media.size - range.suffix) : 0);
    const length = range?.length ?? media.size - start;
    h.set("Content-Length", String(length));
    if (range) h.set("Content-Range", `bytes ${start}-${start + length - 1}/${media.size}`);
    return new Response(method === "HEAD" ? null : media.body, { status: range ? 206 : 200, headers: h });
  }
  const page = path === "/api/portfolio" ? { key: contentKey, validate: valid }
    : path === "/api/bio" ? { key: bioKey, validate: validBio } : null;
  if (page && method === "GET") {
    const stored = await env.BUCKET.get(page.key);
    return json({ content: stored ? await stored.json() : null, revision: stored?.etag ?? null });
  }
  if (method !== "GET" && request.headers.get("Origin") !== url.origin) return json({ error: "Origem inválida." }, 403);
  if (path === "/api/admin/login" && method === "POST") return login(request, env);
  if (path === "/api/admin/logout" && method === "POST") return json({ ok: true }, 200, cookie("", 0));
  if (!(await authenticated(request, env))) return json({ error: "Entre para editar." }, 401);
  if (path === "/api/admin/session" && method === "GET") return json({ ok: true });
  if (page && method === "PUT") {
    const raw = await request.text();
    if (raw.length > 750000) return json({ error: "Conteúdo muito grande." }, 413);
    const { content, revision } = JSON.parse(raw);
    if (!page.validate(content) || revision !== null && typeof revision !== "string") return json({ error: "Revise os campos antes de salvar." }, 400);
    const stored = await env.BUCKET.put(page.key, JSON.stringify(content), {
      onlyIf: revision === null ? { etagDoesNotMatch: "*" } : { etagMatches: revision },
      httpMetadata: { contentType: "application/json" },
    });
    if (!stored) return json({ error: "Outra edição foi salva. Recarregue o painel para atualizar." }, 409);
    return json({ revision: stored.etag });
  }
  if (path === "/api/admin/media" && method === "POST") {
    if (Number(request.headers.get("Content-Length")) > 26 * 1024 * 1024) return json({ error: "Arquivo maior que 25 MB." }, 413);
    const file = (await request.formData()).get("file");
    const extension = file instanceof File && mediaTypes.get(file.type);
    if (!extension || file.size === 0 || file.size > 25 * 1024 * 1024) return json({ error: "Envie uma imagem ou vídeo aceito de até 25 MB." }, 400);
    const id = crypto.randomUUID() + "." + extension;
    await env.BUCKET.put("portfolio/media/" + id, file.stream(), { httpMetadata: { contentType: file.type } });
    return json({ url: "/portfolio-media/" + id });
  }
  return json({ error: "Endereço indisponível." }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch {
      return json({ error: "Não foi possível concluir a operação." }, 500);
    }
  },
};
