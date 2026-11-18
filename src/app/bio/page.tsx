"use client";

import Image from "../site-image";
import { sitePath } from "../site-path";
import { readPage } from "../site-data";
import published from "../published-bio.json";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { currentBio, type BioData, type BioRelease } from "../bio-data";
import "./bio.css";

const external = { target: "_blank", rel: "noopener noreferrer" };
const shapes = [
  <g key="instagram" fill="none" stroke="currentColor" strokeWidth="1.65"><rect x="3.25" y="3.25" width="17.5" height="17.5" rx="4.1"/><circle cx="12" cy="12" r="3.65"/><path d="M17.2 6.5v1.7"/></g>,
  <g key="youtube" fill="none" stroke="currentColor" strokeWidth="1.65"><rect x="2.75" y="5.8" width="18.5" height="12.4" rx="2.5"/><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none"/></g>,
  <path key="tiktok" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" d="M14 3h3c.25 2.5 2 4.2 4 4.5v3a8 8 0 0 1-4-1.45v6.4a5.3 5.3 0 1 1-6.15-5.23v3a2.4 2.4 0 1 0 3.15 2.23Z"/>,
  <path key="x" fill="none" stroke="currentColor" strokeWidth="1.65" d="M4 3.5h4.5L20 20.5h-4.5Zm15.7 0-6.5 7.25m-2.6 3L4 20.5"/>,
  <path key="soundcloud" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" d="M12 17h7.4A2.9 2.9 0 0 0 20 11.2a4.7 4.7 0 0 0-8-3.8ZM9 8v9M6 10.5v6.5M3 12.8v3.4"/>,
];

function Backdrop({ video, poster }: { video: string; poster: string }) {
  const motion = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = motion.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      if (preference.matches) element?.pause();
      else void element?.play().catch(() => {});
    }
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, [video]);
  return <div className="bio-backdrop" aria-hidden="true">
    {poster && <Image src={poster} alt="" fill sizes="100vw" loading="eager" />}
    {video && <video ref={motion} src={sitePath(video)} poster={sitePath(poster || undefined)} muted playsInline loop preload="metadata" />}
    <div className="bio-stage-sigil bio-stage-sigil-near" />
    <div className="bio-stage-sigil bio-stage-sigil-far" />
  </div>;
}

function Release({ release }: { release: BioRelease }) {
  const title = release.showTitle && release.title;
  const art = release.image && <Image src={release.image} alt={release.alt} width={960} height={960} sizes="(max-width: 540px) 82vw, 430px" />;
  return <article className="bio-release">
    {title && <h2>{release.title}</h2>}
    {release.video ? <video className="bio-release-video" src={sitePath(release.video)} poster={sitePath(release.image || undefined)} controls playsInline preload="metadata" />
      : release.href && art ? <a className="bio-cover" href={release.href} {...external} aria-label={release.linkText || release.caption || release.alt}>{art}</a>
      : art && <div className="bio-cover">{art}</div>}
    {(release.badge || release.caption || release.href) && <div className="bio-release-footer">
      <div className="bio-release-caption">
        {release.badge && <span className="bio-badge">{release.badge}</span>}
        {release.caption && <span>{release.caption}</span>}
      </div>
      {release.href && <a className="bio-release-link" href={release.href} {...external}>{release.linkText || "Abrir lançamento"} <ArrowUpRight aria-hidden="true" size={15} /></a>}
    </div>}
  </article>;
}

function CopyContact({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const field = document.createElement("textarea");
      field.value = email;
      field.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      const focused = document.activeElement;
      document.body.append(field);
      field.select();
      const success = document.execCommand("copy");
      field.remove();
      if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
      if (!success) {
        setCopyFailed(true);
        return;
      }
    }
    window.clearTimeout(timer.current);
    setCopied(true);
    timer.current = window.setTimeout(() => setCopied(false), 2600);
  }

  return <div className="bio-contact">
    <p>Contatos</p>
    <button type="button" className="bio-email" aria-label={`Copiar e-mail ${email}`} onClick={() => { void copy(); }}>
      <span data-copied={copied}>{copied ? "E-mail copiado" : email}</span>
    </button>
    <span className="sr-only" role="status">{copyFailed ? "Copie o endereço de e-mail manualmente." : copied ? "E-mail copiado" : ""}</span>
  </div>;
}

const saoPauloDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit" });
const posterDate = () => saoPauloDate.format(new Date()).replaceAll("/", ".");

function Today() {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setDate(posterDate());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return <time className="bio-date" suppressHydrationWarning>{date ?? posterDate()}</time>;
}

export default function Bio() {
  const [data, setData] = useState(() => currentBio(published as BioData));
  useEffect(() => {
    if (window.parent !== window && new URLSearchParams(window.location.search).get("preview") === "editor") {
      const receive = (event: MessageEvent) => {
        if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== "bio-draft") return;
        setData(event.data.content as BioData);
      };
      window.addEventListener("message", receive);
      window.parent.postMessage({ type: "bio-preview-ready" }, window.location.origin);
      return () => window.removeEventListener("message", receive);
    }
    const abort = new AbortController();
    void readPage<BioData>("bio", abort.signal).then(({ content }) => {
      if (content && !abort.signal.aborted) setData(currentBio(content));
    }).catch(() => {});
    return () => abort.abort();
  }, []);
  return <main className="bio">
    <div className="bio-content">
      <header className="bio-profile">
        <div className="bio-masthead">
          <h1 aria-label={data.name}>{data.name.trim().toLocaleUpperCase("pt-BR").split(/\s+/).map((word, index) =>
            <span className="bio-word" key={index} aria-hidden="true">{Array.from(word, (letter, i) => <span key={i}>{letter}</span>)}</span>)}</h1>
          <Today />
        </div>
        {data.tagline && <p className="bio-tagline">{data.tagline}</p>}
        <div className="bio-credits">
          <p>{data.description}</p>
          {data.location && <p>{data.location}</p>}
        </div>
        <div className="bio-contact-row">
          <div className="bio-index" aria-hidden="true">{["8", "8", "2", "2", "3", "3"].map((digit, index) => <span key={index}>{digit}</span>)}</div>
          {data.email && <CopyContact email={data.email} />}
        </div>
        <nav className="bio-socials" aria-label="Redes sociais">
          {data.socials.map(({ label, url }, index) => url && <a href={url} {...external} key={index} aria-label={label} title={label}>
            <svg aria-hidden="true" viewBox="0 0 24 24">{shapes[index] ?? <path d="M5 19 19 5M8 5h11v11" fill="none" stroke="currentColor" strokeWidth="2" />}</svg>
          </a>)}
        </nav>
      </header>
      <div className="bio-stage" data-releases={data.releases.length > 0}>
        <Backdrop video={data.backgroundVideo} poster={data.backgroundPoster} />
        {data.releases.length > 0 && <section className="bio-releases" aria-label="Lançamentos">
        {data.releases.map((release) => <Release key={release.id} release={release} />)}
        </section>}
      </div>
    </div>
  </main>;
}
