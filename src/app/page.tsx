"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Image from "./site-image";
import { readPage } from "./site-data";
import published from "./published-portfolio.json";
import { refreshCaseArt, type PortfolioData, type SectionId } from "./portfolio-data";
import { ArrowIcon, CopyEmail, DisplayLetters, MarkIcon, FeaturedStack, MotionVideo, PortfolioMotion, ProjectGallery, SectionDisclosure, SectionNav, SkillCard, WordReveal } from "./portfolio-interactive";

const external = { target: "_blank", rel: "noopener noreferrer" };

export default function Home() {
  const [data, setData] = useState<PortfolioData>(() => refreshCaseArt(published as PortfolioData));
  const [ready, setReady] = useState(false);
  const [previewSection, setPreviewSection] = useState<SectionId | null>(null);
  const [previewProject, setPreviewProject] = useState<string | null>(null);
  const [previewFrame, setPreviewFrame] = useState<number | null>(null);
  const [jumpTarget, setJumpTarget] = useState<string | null>(null);
  useEffect(() => {
    if (window.parent !== window && new URLSearchParams(window.location.search).get("preview") === "editor") {
      const onDraft = (event: MessageEvent) => {
        if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.type !== "portfolio-draft") return;
        const { content, section, project, frame } = event.data as { content: PortfolioData; section: SectionId; project: string | null; frame: number | null };
        setData(content);
        setPreviewSection(section);
        setPreviewProject(project);
        setPreviewFrame(frame);
      };
      window.addEventListener("message", onDraft);
      window.parent.postMessage({ type: "portfolio-preview-ready" }, window.location.origin);
      return () => window.removeEventListener("message", onDraft);
    }

    const abort = new AbortController();
    void readPage<PortfolioData>("portfolio", abort.signal).then(({ content }) => {
      if (content && !abort.signal.aborted) setData(refreshCaseArt(content));
    }).catch(() => {}).finally(() => {
      if (!abort.signal.aborted) setReady(true);
    });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const anchor = previewProject ?? previewSection;
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "instant" });
  }, [previewSection, previewProject]);
  const { aiSkills, brands, experience, profile, projects, skills, text } = data;
  useEffect(() => {
    const expandForProjectLink = () => {
      const id = window.location.hash.slice(1);
      if (projects.some((project) => project.id === id)) {
        setJumpTarget(id);
      }
    };
    expandForProjectLink();
    window.addEventListener("hashchange", expandForProjectLink);
    return () => window.removeEventListener("hashchange", expandForProjectLink);
  }, [projects]);
  useEffect(() => {
    if (!jumpTarget) return;
    const disclosure = document.querySelector<HTMLDetailsElement>("#projetos .section-disclosure-root");
    if (!disclosure) return;
    const alreadyOpen = disclosure.open;
    disclosure.open = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      if (disclosure.open) document.getElementById(jumpTarget)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
      setJumpTarget(null);
    }, alreadyOpen || reduced ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [jumpTarget]);
  const section = (id: SectionId) => data.sections.find((item) => item.id === id)!;
  const theme = (id: SectionId): CSSProperties => {
    const { titleColor, subtitleColor, background } = section(id);
    return { "--section-title": titleColor, "--section-subtitle": subtitleColor, "--section-background": background } as CSSProperties;
  };
  const panels: Record<SectionId, ReactNode> = {
    inicio: <section id="inicio" style={theme("inicio")} className="intro" aria-labelledby="headline">
        <div className="poster">
          <h1 id="headline" className="headline" aria-label="Estratégia de conteúdo, design e direção criativa">
            <span className="headline-first" aria-hidden="true"><DisplayLetters text={section("inicio").title} /></span>
            <span className="headline-second" aria-hidden="true"><DisplayLetters text={section("inicio").subtitle} /></span>

          </h1>
          <FeaturedStack projects={projects} linkLabel={text.projectLink} onVisit={setJumpTarget} />

        </div>
        <div className="intro-copy" data-reveal>
          <div className="intro-layout">
            <div className="direction-mark" aria-hidden="true"><span>{text.directionMark}</span><DisplayLetters text={text.directionStart} /><div className="poster-rectangles" data-rectangles><i /><i /><i /></div></div>
            <p className="intro-bio"><WordReveal text={profile.intro} /></p>
            <div className="direction-type" aria-hidden="true"><DisplayLetters text={text.directionEnd} /></div>
          </div>
          <div className="split-display">
            <span className="split-top" aria-hidden="true">{text.splitWord}</span>
            <p className="intro-statement"><WordReveal text={text.introStatement} /></p>
            <span className="split-bottom" aria-hidden="true">{text.splitWord}</span>
          </div>

        </div>
    </section>,

    projetos: <section id="projetos" style={theme("projetos")} className="work" aria-labelledby="work-title">
      <SectionDisclosure title={section("projetos").title} titleId="work-title" showInPreview={previewSection === "projetos"}>
        {projects.map((project) => <ProjectGallery key={project.id} project={project} detailLabel={text.projectDetail} filmLabel={text.filmLink} previewFrame={previewProject === project.id ? previewFrame ?? 0 : undefined} />)}
        <div className="behance-callout" data-reveal>
          {profile.behance
            ? <a href={profile.behance} {...external}><small>{text.explore}</small><DisplayLetters text={text.moreWork} /><br /><DisplayLetters text={text.onBehance} /> <ArrowIcon /></a>
            : <strong><small>{text.explore}</small>{text.moreWork}<br /> {text.onBehance}</strong>}
        </div>
      </SectionDisclosure>
    </section>,

    competencias: <section id="competencias" style={theme("competencias")} className="skills" aria-labelledby="skills-title">
        <h2 id="skills-title" className="section-title large-display skills-title"><DisplayLetters text={section("competencias").title} /><DisplayLetters text={section("competencias").subtitle} /></h2>
        <div className="wide-content">
          <h3 className="section-subtitle"><DisplayLetters text={text.creation} /></h3>
          <div className="skill-grid">
            {skills.map(({ title, description, icon }) => (
              <SkillCard key={title} title={title} description={description} icon={icon} />
            ))}
          </div>
          <div className="ai-skills" data-reveal>
            <h3 className="section-subtitle"><DisplayLetters text={text.artificialIntelligence} /></h3>
            <ul>{aiSkills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
          </div>
        </div>
    </section>,

    trajetoria: <section id="trajetoria" style={theme("trajetoria")} className="trajectory" aria-labelledby="trajectory-title">
        <div className="content-width">
          <h2 id="trajectory-title" className="section-title"><DisplayLetters text={section("trajetoria").title} /></h2>
          <ul className="timeline">
            {experience.map(({ company, role, period }, index) => (
              <li key={index} data-reveal><strong>{company}</strong><span>{role}</span><span>{period}</span></li>
            ))}
          </ul>
        </div>
    </section>,

    clientes: <section id="clientes" style={theme("clientes")} className="clients wide-content" aria-labelledby="clients-title">
      <SectionDisclosure title={section("clientes").title} titleId="clients-title" wide showInPreview={previewSection === "clientes"}>
        <p data-reveal>{text.clientsIntro}</p>
        <ul className="brand-list" data-reveal>
          {brands.map(({ brand, role }, index) => (
            <li key={index} tabIndex={0}>
              <span className="brand-front">{brand}</span>
              <span className="brand-back">{role}</span>
            </li>
          ))}
        </ul>
      </SectionDisclosure>
    </section>,

    contato: <section id="contato" style={theme("contato")} className="contact wide-content" aria-labelledby="contact-title">
        <h2 id="contact-title" className="section-title large-display"><DisplayLetters text={section("contato").title} /><br /><DisplayLetters text={section("contato").subtitle} /></h2>
        <p className="contact-intro" data-reveal>{text.contactIntro}</p>
        <div className="contact-grid" data-reveal>
          <div className="contact-map">
            <div className="map-window" role="img" aria-label="Mapa esquemático da Liberdade e dos bairros próximos no centro de São Paulo">
              <span className="map-plane" aria-hidden="true"><span className="map-art">
                <span className="map-neighborhood map-se">Sé</span>
                <span className="map-neighborhood map-bela-vista">Bela Vista</span>
                <span className="map-neighborhood map-cambuci">Cambuci</span>
                <span className="map-neighborhood map-aclimacao">Aclimação</span>
                <span className="map-neighborhood map-liberdade">Liberdade</span>
                <span className="map-pin">
                  <svg viewBox="0 0 40 52" fill="none">
                    <path d="M20 49C17 44 3 31 3 20a17 17 0 1 1 34 0c0 11-14 24-17 29Z" fill="#482775" stroke="#24163e" strokeWidth="3" transform="translate(2 1)" />
                    <path d="M18 48C15 43 2 30 2 19a16 16 0 1 1 32 0c0 11-13 24-16 29Z" fill="#d8baff" stroke="#69439b" strokeWidth="2" />
                    <circle cx="18" cy="18" r="6" fill="#69439b" stroke="#f0dcff" strokeWidth="1.5" />
                  </svg>
                </span>
              </span></span>
            </div>
            <div className="map-caption"><span>{profile.location}</span></div>
          </div>
          <div className="contact-actions">
            <CopyEmail email={profile.email} greeting={text.greeting} display={text.emailDisplay} copied={text.copied} />
            <div className="social-links" aria-label="Redes sociais">
              {profile.instagram ? <a href={profile.instagram} {...external}>{text.instagram} <ArrowIcon /></a> : <span>{text.instagram}</span>}
              <a href={profile.linkedin} {...external}>{text.linkedin} <ArrowIcon /></a>
              {profile.behance ? <a href={profile.behance} {...external}>{text.behance} <ArrowIcon /></a> : <span>{text.behance}</span>}
            </div>
          </div>
        </div>
    </section>,

  };

  return (
    <main className="portfolio" style={{ "--custom-surface": (previewSection ? section(previewSection) : data.sections[0]).background } as CSSProperties}>
      <a className="signature" href="#inicio" aria-label="André Calazans, voltar ao início">
        {profile.logoVideo ? <MotionVideo src={profile.logoVideo} poster={text.logo} /> : <Image className="signature-logo" src={text.logo} alt="Calazans" width={2160} height={720} />}
        <span className="signature-subtitle"><MarkIcon /> {text.portfolio}</span>
      </a>
      <SectionNav sections={data.sections} />
      {ready && <PortfolioMotion />}
      {data.sections.map(({ id }) => <Fragment key={id}>{panels[id]}</Fragment>)}
      <footer className="utility-bar">
        <span className="location-label"><i aria-hidden="true" />{profile.location}</span>
        <span className="availability-label">{text.availability}</span>
        {profile.booking
          ? <a className="booking-link" href={profile.booking} {...external}><span className="booking-icon"><MarkIcon /></span> {text.booking}</a>
          : <span className="booking-link">{text.booking}</span>}
      </footer>
    </main>
  );
}
