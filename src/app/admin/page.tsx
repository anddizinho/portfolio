"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "../site-image";
import { sitePath } from "../site-path";
import { backend, enterEditor, readPage, verifyEditor } from "../site-data";
import { BriefcaseBusiness, FolderOpen, House, Mail, Sparkles, Users } from "lucide-react";
import { ColorField, colorKeys, colorLabels, type ColorKey } from "./color-field";
import { DragHandle, reorder } from "./drag-handle";
import { defaultPortfolio, refreshCaseArt, type Palette, type PortfolioData, type SectionId } from "../portfolio-data";
import "./dashboard.css";
import { savePage, uploadMedia } from "./editor-api";
import { BioEditor, EditorAreas } from "./bio-editor";

type Path = (string | number)[];
const names: Record<string, string> = {
  profile:"Perfil e links", projects:"Projetos e capas", sections:"Ordem, títulos e cores das seções",
  text:"Textos gerais", skills:"Competências", aiSkills:"Inteligência artificial", experience:"Trajetória",
  brands:"Clientes", name:"Nome", email:"E-mail", location:"Localização", intro:"Apresentação",
  title:"Título", subtitle:"Subtítulo", titleColor:"Cor do título", subtitleColor:"Cor do subtítulo",
  background:"Cor de fundo", label:"Rótulo", featuredLabel:"Nome no cartão inicial", area:"Créditos e função",
  summary:"Descrição", frames:"Quadros (o primeiro é a capa)", image:"Imagem", alt:"Descrição da imagem",
  src:"Endereço da imagem", video:"Vídeo", logo:"Imagem do logo", logoVideo:"Vídeo opcional do logo",
  filmUrl:"Link externo do filme", role:"Função", company:"Empresa", period:"Período", brand:"Marca",
  description:"Descrição", portfolio:"Nome abaixo do logo", directionMark:"Símbolo da abertura",
  directionStart:"Primeira parte de Direção", directionEnd:"Segunda parte de Direção", splitWord:"Palavra de fundo",
  introStatement:"Texto da abertura", explore:"Chamada do Behance", moreWork:"Título do Behance",
  onBehance:"Complemento do Behance", creation:"Título da criação", artificialIntelligence:"Título da IA",
  clientsIntro:"Introdução dos clientes", contactIntro:"Introdução do contato", greeting:"Saudação do e-mail",
  emailDisplay:"E-mail exibido", copied:"Mensagem de cópia", availability:"Disponibilidade",
  booking:"Agendamento", projectLink:"Botão Ver projeto", projectDetail:"Quadro de texto", filmLink:"Botão do filme",
};
const labelOf = (key: string | number) => typeof key === "number" ? `Item ${key + 1}` : names[key] ?? key;
const mediaKeys = new Set(["src", "logo", "video", "logoVideo"]);
const longKeys = new Set(["summary", "description", "intro", "introStatement", "clientsIntro", "contactIntro"]);
const internalKeys = new Set(["id", "number", "icon", "theme"]);

const sectionNames: Record<SectionId, string> = {
  inicio: "Início", projetos: "Trabalhos", competencias: "Competências",
  trajetoria: "Trajetória", clientes: "Clientes", contato: "Contato",
};
const sectionIcons = {
  inicio: House, projetos: FolderOpen, competencias: Sparkles,
  trajetoria: BriefcaseBusiness, clientes: Users, contato: Mail,
};
const editableLists = {
  experience: { add: "Adicionar experiência", empty: { company: "", role: "", period: "" } },
  brands: { add: "Adicionar cliente", empty: { brand: "", role: "" } },
};

const defaultPalette: Palette = { titleColor: "#f5f48e", subtitleColor: "#f5f48e", background: "#19163d" };
const sectionFields = {
  inicio: ["portfolio","directionMark","directionStart","directionEnd","splitWord","introStatement"],
  projetos: ["explore","moreWork","onBehance","projectLink","projectDetail","filmLink"],
  competencias: ["creation","artificialIntelligence"],
  trajetoria: [],
  clientes: ["clientsIntro"],
  contato: ["contactIntro","greeting","emailDisplay","copied","availability","booking","instagram","linkedin","behance"],
} as const;

function MediaThumb({ src, alt, video = false }: { src?: string; alt: string; video?: boolean }) {
  if (!src || !/^(\/[^/]|https:\/\/)/i.test(src)) return <span className="dashboard-thumbnail dashboard-thumbnail-empty">Nenhum arquivo</span>;
  return <span className="dashboard-thumbnail">
    {video
      ? <video src={sitePath(src)} muted playsInline preload="metadata" aria-label={alt} />
      : <Image src={src} alt={alt} fill sizes="(max-width: 700px) 45vw, 220px" unoptimized />}
  </span>;
}

function Group({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`dashboard-panel ${className}`}><h2>{title}</h2>{children}</section>;
}

function entryName(value: unknown, index: number) {
  if (typeof value === "string") return value || labelOf(index);
  const entry = value as {title?: string; label?: string; brand?: string; company?: string; name?: string} | null;
  return entry?.label || entry?.title || entry?.brand || entry?.company || entry?.name || labelOf(index);
}

function Field({ name, value, path, change, uploadingFiles, uploadCount }: {
  name: string;
  value: unknown;
  path: Path;
  change(path: Path, value: unknown): void;
  uploadingFiles: boolean;
  uploadCount(update: (count: number) => number): void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  if (Array.isArray(value)) {
    const options = name === "experience" || name === "brands" ? editableLists[name] : undefined;
    return <>
      <ol className="editor-list" data-sort-list ref={listRef}>{value.map((item, index) => (
      <li key={index} data-sort-index={index}>
        <div className="editor-row">
          <DragHandle index={index} length={value.length} label={entryName(item, index)} locked={uploadingFiles}
            onMove={(target) => change(path, reorder(value, index, target))} />
          <strong>{entryName(item, index)}</strong>
          {options && <button type="button" className="dashboard-remove" disabled={uploadingFiles} aria-label={`Remover ${entryName(item, index)}`}
            onClick={() => change(path, value.filter((_, position) => position !== index))}>Remover</button>}
        </div>
        <Field name={String(index)} value={item} path={[...path, index]} change={change} uploadingFiles={uploadingFiles} uploadCount={uploadCount} />
      </li>
      ))}</ol>
      {options && <button type="button" disabled={uploadingFiles || value.length >= 100} onClick={() => {
        change(path, [...value, { ...options.empty }]);
        requestAnimationFrame(() => {
          const details = listRef.current?.lastElementChild?.querySelector("details");
          if (!details) return;
          details.open = true;
          details.querySelector("input")?.focus();
        });
      }}>{options.add}</button>}
    </>;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const extra = path[0] === "profile" && path.length === 1 ? ["instagram","behance","booking","logoVideo"]
      : "frames" in record ? ["filmUrl"] : "image" in record && "label" in record ? ["video"] : [];
    const entries = Object.entries({ ...Object.fromEntries(extra.map(key => [key, ""])), ...record })
      .filter(([key]) => !internalKeys.has(key));
    return <details className="editor-group">
      <summary>{path.length === 1 ? labelOf(name) : entryName(value, Number(name)) === "Item NaN" ? labelOf(name) : entryName(value, Number(name))}</summary>
      <div className="editor-fields">{entries.map(([key, item]) => (
        <Field key={key} name={key} value={item} path={[...path, key]} change={change} uploadingFiles={uploadingFiles} uploadCount={uploadCount} />
      ))}</div>
    </details>;
  }

  if (typeof value !== "string") return null;
  const numeric = /^\d+$/.test(name);
  const fieldName = numeric ? labelOf(Number(name)) : labelOf(name);
  const color = ["titleColor","subtitleColor","background"].includes(name);
  const upload = async (file: File) => {
    setError("");
    setUploading(true);
    uploadCount((count) => count + 1);
    try {
      change(path, await uploadMedia(file));
    } catch (failed) {
      setError((failed as Error).message);
    } finally {
      setUploading(false);
      uploadCount((count) => count - 1);
    }
  };
  return <div className="editor-field" data-media={mediaKeys.has(name)}>
    {mediaKeys.has(name) && <MediaThumb src={value} alt={fieldName} video={name.toLowerCase().includes("video")} />}
    <label>{fieldName}
      {longKeys.has(name)
        ? <textarea value={value} rows={4} onChange={(event) => change(path, event.target.value)} />
        : <input type={color ? "color" : "text"} value={value} onChange={(event) => change(path, event.target.value)} />}
    </label>
    {mediaKeys.has(name) && <label className="editor-upload">
      {uploading ? "Enviando…" : "Enviar arquivo"}
      <input type="file" disabled={uploading} accept={name.toLowerCase().includes("video") ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif,image/gif"}
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
    </label>}
    {(name === "logoVideo" || name === "video") && value && <button className="dashboard-remove" type="button"
      disabled={uploading} onClick={() => change(path, "")}>{name === "logoVideo" ? "Remover vídeo do logo" : "Remover vídeo"}</button>}
    {name === "logo" && value !== defaultPortfolio.text.logo && <button type="button" className="dashboard-remove"
      disabled={uploading} onClick={() => change(path, defaultPortfolio.text.logo)}>Restaurar imagem original</button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

export default function Admin() {
  const [data, setData] = useState<PortfolioData>(defaultPortfolio);
  const [revision, setRevision] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState<SectionId>("inicio");
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [openFrame, setOpenFrame] = useState<number | null>(null);
  const [uploads, setUploads] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [area, setArea] = useState<"portfolio" | "bio">("portfolio");
  useEffect(() => {
    void Promise.all([verifyEditor(), readPage<PortfolioData>("portfolio")]).then(([, result]) => {
      if (result.content) setData(refreshCaseArt(result.content));
      setRevision(result.revision);
      setAuthorized(true);
    }).catch(() => {}).finally(() => setBusy(false));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await enterEditor();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  function change(path: Path, value: unknown) {
    setData((current) => {
      const next = structuredClone(current) as unknown as Record<string | number, unknown>;
      let parent = next;
      for (const key of path.slice(0, -1)) parent = parent[key] as Record<string | number, unknown>;
      parent[path[path.length - 1]] = value;
      return next as unknown as PortfolioData;
    });
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      setRevision(await savePage("portfolio", data, revision));
      setMessage("Alterações salvas no portfólio.");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  const selected = data.sections.find((section) => section.id === active)!;
  const sectionIndex = data.sections.findIndex((section) => section.id === active);
  const projectIndex = data.projects.findIndex((item) => item.id === openProject);
  const project = data.projects[projectIndex];
  const frameIndex = openFrame ?? -1;
  const previewRef = useRef<HTMLIFrameElement>(null);
  const draft = useRef({ content: data, section: active, project: openProject, frame: openFrame });

  useEffect(() => {
    draft.current = { content: data, section: active, project: openProject, frame: openFrame };
    if (!showPreview || !authorized) return;
    const timer = window.setTimeout(() => {
      previewRef.current?.contentWindow?.postMessage({ type: "portfolio-draft", ...draft.current }, window.location.origin);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [data, active, openProject, openFrame, authorized, showPreview]);

  useEffect(() => {
    const ready = (event: MessageEvent) => {
      const frame = previewRef.current?.contentWindow;
      if (frame && event.origin === window.location.origin && event.source === frame && event.data?.type === "portfolio-preview-ready") {
        frame.postMessage({ type: "portfolio-draft", ...draft.current }, window.location.origin);
      }
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, []);

  function edit(name: string, path: Path, value: unknown) {
    return <Field key={path.join(".")} name={name} value={value} path={path} change={change} uploadingFiles={uploads > 0} uploadCount={setUploads} />;
  }

  function move<T>(items: T[], index: number, target: number, path: Path) {
    if (uploads) return;
    change(path, reorder(items, index, target));
  }

  function changePalette(key: ColorKey, value: string) {
    setData((current) => {
      const palette = current.palette ?? defaultPalette;
      return {
        ...current, palette: { ...palette, [key]: value },
        sections: current.sections.map((section) => section[key].toLowerCase() === palette[key].toLowerCase()
          ? { ...section, [key]: value } : section),
      };
    });
  }

  function applyPalette() {
    setData((current) => {
      const palette = current.palette ?? defaultPalette;
      return { ...current, sections: current.sections.map((section) => ({ ...section, ...palette })) };
    });
  }

  if (!authorized) return <main className="dashboard-login">
    <a href={sitePath("/")}>← Portfólio</a><h1>Área de edição</h1>
    <form onSubmit={login} className="editor-login">
      <button disabled={busy}>{busy ? "Aguarde…" : "Entrar com GitHub"}</button>
    </form>
    <p role="status">{message}</p>
  </main>;

  const palette = data.palette ?? defaultPalette;
  const textFields = sectionFields[active];
  function logout() {
    void backend().auth.signOut().then(({ error }) => {
      if (error) throw error;
      setAuthorized(false);
      setMessage("");
      setArea("portfolio");
    }).catch((error: Error) => setMessage(error.message));
  }

  return <>
  <main className="dashboard-shell" data-preview={showPreview} hidden={area !== "portfolio"}>
    <aside className="dashboard-sidebar">
      <a className="dashboard-brand" href={sitePath("/")}>Calazans<span>Portfólio</span></a>
      <nav aria-label="Seções do portfólio" data-sort-list>
        {data.sections.map((section, index) => {
          const Icon = sectionIcons[section.id];
          return (
            <div className="dashboard-nav-row" key={section.id} data-active={active === section.id} data-sort-index={index}>
              <DragHandle index={index} length={data.sections.length} label={sectionNames[section.id]} locked={uploads > 0}
                onMove={(target) => move(data.sections, index, target, ["sections"])} />
              <button className="dashboard-nav-item" type="button" aria-current={active === section.id ? "page" : undefined} onClick={() => {
                setActive(section.id);
                setOpenProject(null);
                setOpenFrame(null);
              }}><Icon size={17} aria-hidden="true" />{sectionNames[section.id]}</button>
            </div>
          );
        })}
      </nav>
      <button className="dashboard-logout" type="button" onClick={logout}>Sair</button>
    </aside>
    <div className="dashboard-main">
      <EditorAreas active="portfolio" onChange={setArea} />
      <header className="dashboard-top">
        <h1>{sectionNames[active]}</h1>
        <div className="dashboard-actions">
          <button type="button" aria-pressed={showPreview} onClick={() => setShowPreview(!showPreview)}>{showPreview ? "Ocultar prévia" : "Exibir prévia"}</button>
          <button className="dashboard-primary" type="button" disabled={busy || !!uploads} onClick={() => { void save(); }}>{busy ? "Salvando…" : uploads ? "Enviando arquivos…" : "Salvar alterações"}</button>
        </div>
        {message && <p className="dashboard-message" role="status">{message}</p>}
      </header>

      {active === "inicio" && <Group title="Paleta geral" className="dashboard-highlight">
        <div className="dashboard-colors">{colorKeys.map((key) => <ColorField key={key} label={colorLabels[key]} value={palette[key]} onChange={(value) => changePalette(key, value)} />)}</div>
        <button type="button" onClick={applyPalette}>Aplicar paleta a todas as seções</button>
      </Group>}

      <Group title="Cores e títulos da seção">
        <div className="dashboard-colors">{colorKeys.map((key) => <ColorField key={`${active}-${key}`} label={colorLabels[key]} value={selected[key]} onChange={(value) => change(["sections", sectionIndex, key], value)} />)}</div>
        <div className="dashboard-form-grid">{(["title","subtitle","label"] as const).map((key) => edit(key, ["sections", sectionIndex, key], selected[key]))}</div>
        <button type="button" onClick={() => change(["sections", sectionIndex], { ...selected, ...palette })}>Usar paleta geral nesta seção</button>
      </Group>

      {active === "inicio" && <Group title="Logo e abertura">
        <div className="dashboard-media-grid">
          {edit("logo", ["text", "logo"], data.text.logo)}
          {edit("logoVideo", ["profile", "logoVideo"], data.profile.logoVideo ?? "")}
        </div>
        {edit("intro", ["profile", "intro"], data.profile.intro)}
      </Group>}

      {active === "projetos" && (!project ? <Group title="Nossos trabalhos">
        <ul className="dashboard-projects" data-sort-list>{data.projects.map((item, index) => <li key={item.id} data-sort-index={index}>
          <DragHandle index={index} length={data.projects.length} label={item.title} locked={uploads > 0}
            onMove={(target) => move(data.projects, index, target, ["projects"])} />
          <button className="dashboard-project-card" type="button" onClick={() => { setOpenProject(item.id); setOpenFrame(null); }}>
            <MediaThumb src={item.frames[0]?.image.src} alt="" />
            <span><strong>{item.title}</strong><small>{item.area}</small></span>
            <span aria-hidden="true">↗</span>
          </button>
        </li>)}</ul>
      </Group> : <>
        <Group title={project.title}>
          <button type="button" onClick={() => { setOpenProject(null); setOpenFrame(null); }}>← Todos os trabalhos</button>
          <div className="dashboard-form-grid">{(["title","featuredLabel","area","filmUrl"] as const).map((key) => edit(key, ["projects",projectIndex,key], project[key] ?? ""))}</div>
          {edit("summary", ["projects",projectIndex,"summary"], project.summary)}
          {showPreview && <button type="button" aria-pressed={openFrame === -1} onClick={() => setOpenFrame(-1)}>Prévia do quadro de texto</button>}
        </Group>
        <Group title="Capa e quadros">
          <div className="dashboard-frame-grid" data-sort-list>{project.frames.map((frame, index) => <article key={index} data-active={openFrame === index} data-sort-index={index}>
            <DragHandle index={index} length={project.frames.length} label={frame.label} locked={uploads > 0} onMove={(target) => {
              move(project.frames, index, target, ["projects",projectIndex,"frames"]);
              setOpenFrame((current) => {
                if (current === null || current < 0) return current;
                if (current === index) return target;
                if (index < current && current <= target) return current - 1;
                if (target <= current && current < index) return current + 1;
                return current;
              });
            }} />
            <button type="button" className="dashboard-frame" aria-pressed={openFrame === index} onClick={() => setOpenFrame(index)}>
              <MediaThumb src={frame.image.src} alt={frame.image.alt} />
              <span>{index === 0 ? "Capa · " : ""}{frame.label}{frame.video ? " · Vídeo" : ""}</span>
            </button>
          </article>)}</div>
          {frameIndex >= 0 && <div className="dashboard-frame-fields">
            {edit("label", ["projects",projectIndex,"frames",frameIndex,"label"], project.frames[frameIndex].label)}
            <div className="dashboard-media-grid">
              {edit("src", ["projects",projectIndex,"frames",frameIndex,"image","src"], project.frames[frameIndex].image.src)}
              {edit("video", ["projects",projectIndex,"frames",frameIndex,"video"], project.frames[frameIndex].video ?? "")}
            </div>
            {edit("alt", ["projects",projectIndex,"frames",frameIndex,"image","alt"], project.frames[frameIndex].image.alt)}
            {project.frames[frameIndex].companion && edit("Painel lateral", ["projects",projectIndex,"frames",frameIndex,"companion"], project.frames[frameIndex].companion)}
          </div>}
        </Group>
      </>)}

      {active === "competencias" && <><Group title="Cartões de competências">{edit("skills", ["skills"], data.skills)}</Group><Group title="Inteligência artificial">{edit("aiSkills", ["aiSkills"], data.aiSkills)}</Group></>}
      {active === "trajetoria" && <Group title="Experiências">{edit("experience", ["experience"], data.experience)}</Group>}
      {active === "clientes" && <Group title="Clientes e funções">{edit("brands", ["brands"], data.brands)}</Group>}
      {active === "contato" && <Group title="Perfil e links"><div className="dashboard-form-grid">
        {(["name","location","email","linkedin","instagram","behance","booking"] as const).map((key) => edit(key, ["profile",key], data.profile[key] ?? ""))}
      </div></Group>}
      {textFields.length > 0 && <Group title="Textos da seção"><div className="dashboard-form-grid">{textFields.map((key) => edit(key, ["text",key], data.text[key]))}</div></Group>}
    </div>
    {showPreview && <aside className="dashboard-preview">
      <header><strong>Prévia</strong><small>Rascunho</small></header>
      <iframe ref={previewRef} src={sitePath("/?preview=editor")} title="Prévia do portfólio" onLoad={() => previewRef.current?.contentWindow?.postMessage({ type: "portfolio-draft", ...draft.current }, window.location.origin)} />
    </aside>}
  </main>
  <BioEditor active={area === "bio"} onChangeArea={setArea} onLogout={logout} />
  </>;
}
