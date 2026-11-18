"use client";

import Image from "../site-image";
import { sitePath } from "../site-path";
import { readPage } from "../site-data";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { currentBio, defaultBio, emptyRelease, socialPlatforms, type BioData, type BioRelease } from "../bio-data";
import { DragHandle, reorder } from "./drag-handle";
import { savePage, uploadMedia } from "./editor-api";

type Area = "portfolio" | "bio";

export function EditorAreas({ active, onChange }: { active: Area; onChange(area: Area): void }) {
  return <nav className="dashboard-editor-areas" aria-label="Área do editor">
    <button type="button" aria-pressed={active === "portfolio"} onClick={() => onChange("portfolio")}>Portfólio</button>
    <button type="button" aria-pressed={active === "bio"} onClick={() => onChange("bio")}>Bio</button>
  </nav>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="dashboard-panel"><h2>{title}</h2>{children}</section>;
}

function TextField({ label, value, onChange, multiline = false }: {
  label: string;
  value: string;
  onChange(value: string): void;
  multiline?: boolean;
}) {
  return <div className="editor-field"><label>{label}
    {multiline
      ? <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
      : <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />}
  </label></div>;
}

function MediaField({ label, value, video, onChange, onUpload }: {
  label: string;
  value: string;
  video?: boolean;
  onChange(value: string): void;
  onUpload(file: File, onChange: (url: string) => void): Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const previewable = /^\/(?!\/)|^https:\/\//.test(value);
  return <div className="editor-field" data-media="true">
    {previewable && <div className="dashboard-thumbnail">
      {video ? <video src={sitePath(value)} preload="metadata" muted playsInline controls />
        : <Image src={value} fill alt={label} sizes="200px" unoptimized />}
    </div>}
    <TextField label={label} value={value} onChange={onChange} />
    <label className="editor-upload">{uploading ? "Enviando…" : "Enviar arquivo"}
      <input type="file" disabled={uploading}
        accept={video ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif,image/gif"}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          event.target.value = "";
          setUploading(true);
          void onUpload(file, onChange).finally(() => setUploading(false));
        }} />
    </label>
    {value && <button type="button" className="dashboard-remove" disabled={uploading} onClick={() => onChange("")}>Remover mídia</button>}
  </div>;
}

const profileFields = { name: "Título", tagline: "Chamada do cartaz", description: "Descrição", location: "Localização", email: "E-mail" } as const;
const releaseFields = { badge: "Chamada acima da capa", caption: "Texto abaixo da capa", title: "Nome do set", alt: "Descrição da imagem",
  href: "Link do lançamento", linkText: "Texto do link" } as const;

export function BioEditor({ active, onChangeArea, onLogout }: { active: boolean; onChangeArea(area: Area): void; onLogout(): void }) {
  const [data, setData] = useState(defaultBio);
  const [revision, setRevision] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [preview, setPreview] = useState(true);
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(data);

  useEffect(() => {
    const abort = new AbortController();
    void readPage<BioData>("bio", abort.signal)
      .then((result) => { setData(currentBio(result.content)); setRevision(result.revision); setLoaded(true); })
      .catch((error: Error) => { if (!abort.signal.aborted) setStatus(error.message); });
    return () => abort.abort();
  }, []);

  function broadcast() {
    frame.current?.contentWindow?.postMessage({ type: "bio-draft", content: latest.current }, window.location.origin);
  }

  useEffect(() => {
    latest.current = data;
    if (!active || !preview) return;
    const timer = window.setTimeout(broadcast, 100);
    return () => window.clearTimeout(timer);
  }, [data, active, preview]);

  useEffect(() => {
    function ready(event: MessageEvent) {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow
        && event.data?.type === "bio-preview-ready") broadcast();
    }
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, []);

  function field<K extends keyof BioData>(key: K, value: BioData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function releaseField<K extends keyof BioRelease>(id: string, key: K, value: BioRelease[K]) {
    setData((current) => ({ ...current, releases: current.releases.map((item) => item.id === id ? { ...item, [key]: value } : item) }));
  }

  async function upload(file: File, apply: (url: string) => void) {
    setUploads((count) => count + 1);
    setStatus("");
    try {
      apply(await uploadMedia(file));
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setUploads((count) => count - 1);
    }
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      setRevision(await savePage("bio", data, revision));
      setStatus("Alterações salvas na Bio.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!active) return null;

  return <main className="dashboard-shell" data-preview={preview}>
    <aside className="dashboard-sidebar">
      <a className="dashboard-brand" href={sitePath("/bio/")} target="_blank" rel="noopener noreferrer">Xandrielly<span>Bio</span></a>
      <nav aria-label="Seções da Bio" className="dashboard-bio-nav">
        <a href="#bio-profile-editor">Perfil</a><a href="#bio-socials-editor">Redes sociais</a><a href="#bio-releases-editor">Lançamentos</a>
      </nav>
      <button className="dashboard-logout" type="button" onClick={onLogout}>Sair</button>
    </aside>
    <div className="dashboard-main">
      <EditorAreas active="bio" onChange={onChangeArea} />
      <header className="dashboard-top">
        <h1>Bio</h1>
        <div className="dashboard-actions">
          <button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? "Ocultar prévia" : "Exibir prévia"}</button>
          <button className="dashboard-primary" type="button" disabled={!loaded || saving || !!uploads} onClick={() => { void save(); }}>
            {saving ? "Salvando…" : uploads ? "Enviando arquivos…" : "Salvar Bio"}
          </button>
        </div>
        {status && <p className="dashboard-message" role="status">{status}</p>}
      </header>
      {loaded && <>
        <div id="bio-profile-editor"><Panel title="Perfil e fundo">
          <div className="dashboard-form-grid">{(Object.keys(profileFields) as (keyof typeof profileFields)[]).map((key) =>
            <TextField key={key} label={profileFields[key]} value={data[key]} multiline={key === "description"} onChange={(value) => field(key, value)} />)}</div>
          <div className="dashboard-form-grid">
            <MediaField label="Vídeo de fundo" value={data.backgroundVideo} video onChange={(value) => field("backgroundVideo", value)} onUpload={upload} />
            <MediaField label="Imagem do fundo quando o vídeo está parado" value={data.backgroundPoster} onChange={(value) => field("backgroundPoster", value)} onUpload={upload} />
          </div>
        </Panel></div>
        <div id="bio-socials-editor"><Panel title="Redes sociais">
          {data.socials.map((social, index) => <div className="dashboard-form-grid" key={index}>
            <TextField label={`Nome do link ${socialPlatforms[index] ?? index + 1}`} value={social.label}
              onChange={(label) => setData((current) => ({ ...current, socials: current.socials.map((item, i) => i === index ? { ...item, label } : item) }))} />
            <TextField label="Endereço" value={social.url}
              onChange={(url) => setData((current) => ({ ...current, socials: current.socials.map((item, i) => i === index ? { ...item, url } : item) }))} />
          </div>)}
        </Panel></div>
        <div id="bio-releases-editor"><Panel title="Lançamentos">
          <ol className="editor-list" data-sort-list>{data.releases.map((item, index) =>
            <li key={item.id} data-sort-index={index}>
              <div className="editor-row">
                <DragHandle index={index} length={data.releases.length} label={item.caption || "Lançamento"} locked={!!uploads}
                  onMove={(target) => field("releases", reorder(data.releases, index, target))} />
                <button type="button" aria-expanded={expanded === item.id} onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  {item.caption || item.title || "Novo lançamento"}
                </button>
                <button type="button" className="dashboard-remove" disabled={!!uploads} onClick={() => field("releases", data.releases.filter((entry) => entry.id !== item.id))}>Remover</button>
              </div>
              {expanded === item.id && <>
                <div className="dashboard-form-grid">{(Object.keys(releaseFields) as (keyof typeof releaseFields)[]).map((key) =>
                  <TextField key={key} label={releaseFields[key]} value={item[key]} onChange={(value) => releaseField(item.id, key, value)} />)}</div>
                <label className="dashboard-bio-check"><input type="checkbox" checked={item.showTitle}
                  onChange={(event) => releaseField(item.id, "showTitle", event.target.checked)} /> Exibir nome do set na Bio</label>
                <div className="dashboard-form-grid">
                  <MediaField label="Imagem de capa" value={item.image} onChange={(value) => releaseField(item.id, "image", value)} onUpload={upload} />
                  <MediaField label="Vídeo" value={item.video} video onChange={(value) => releaseField(item.id, "video", value)} onUpload={upload} />
                </div>
              </>}
            </li>)}</ol>
          <button type="button" disabled={data.releases.length >= 100} onClick={() => {
            const id = crypto.randomUUID();
            field("releases", [...data.releases, { ...emptyRelease, id }]);
            setExpanded(id);
          }}>Adicionar lançamento</button>
        </Panel></div>
      </>}
    </div>
    {preview && <aside className="dashboard-preview">
      <header><strong>Prévia da Bio</strong><small>Rascunho</small></header>
      <iframe ref={frame} src={sitePath("/bio/?preview=editor")} title="Prévia da Bio" onLoad={broadcast} />
    </aside>}
  </main>;
}
