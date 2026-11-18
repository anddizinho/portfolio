"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "./site-image";
import { sitePath } from "./site-path";
import type { Project } from "./portfolio-content";

export function PortfolioMotion() {
  useEffect(() => {
    const portfolio = document.querySelector<HTMLElement>(".portfolio");
    const poster = portfolio?.querySelector<HTMLElement>(".poster");
    if (!portfolio || !poster) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const projects = Array.from(portfolio.querySelectorAll<HTMLElement>(".project"));
    const surfaces = Array.from(portfolio.querySelectorAll<HTMLElement>(":scope > section")).reverse();
    const map = portfolio.querySelector<HTMLElement>(".map-window");
    const rectangles = portfolio.querySelector<HTMLElement>(".poster-rectangles");
    let animationFrame = 0;

    const update = () => {
      animationFrame = 0;
      const height = window.innerHeight;
      const surface = surfaces.find((section) => section.getBoundingClientRect().top <= height * .46);
      const surfaceId = surface?.id ?? "inicio";
      if (portfolio.dataset.surface !== surfaceId) {
        portfolio.dataset.surface = surfaceId;
        const background = surface?.style.getPropertyValue("--section-background");
        if (background) portfolio.style.setProperty("--custom-surface", background);
      }
      if (reduce.matches) return;
      portfolio.style.setProperty("--signature-scale", String(1 - Math.min(1, window.scrollY / 285) * .47));
      portfolio.style.setProperty("--signature-offset", `${Math.max(0, 1 - window.scrollY / 285) * 48}px`);

      if (rectangles) {
        const top = rectangles.parentElement?.getBoundingClientRect().top ?? height;
        const progress = Math.min(1, Math.max(0, (height - top) / height));
        rectangles.style.setProperty("--rectangle-scale", String(.86 + progress * .14));
      }

      for (const project of projects) {
        const bounds = project.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > height) continue;
        const center = (bounds.top + bounds.height / 2 - height / 2) / height;
        project.style.setProperty("--project-travel", `${Math.max(-1, Math.min(1, center)) * 50}px`);
      }
    };

    const schedule = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(update);
    };

    const tiltMap = (event: PointerEvent) => {
      if (!map || reduce.matches || event.pointerType !== "mouse") return;
      const bounds = map.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
      const edge = Math.min(1, Math.max(Math.abs(x), Math.abs(y)));
      map.style.setProperty("--map-pitch", `${21 + (1 - edge) * 13}deg`);
      map.style.setProperty("--map-roll", `${x * 5}deg`);
    };
    const resetMap = () => {
      map?.style.removeProperty("--map-pitch");
      map?.style.removeProperty("--map-roll");
    };

    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < .16) continue;
        reveal.unobserve(entry.target);
        entry.target.classList.add("has-entered");
      }
    }, { threshold: .16 });

    portfolio.dataset.motion = "true";
    const letters = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) entry.target.classList.remove("has-entered");
        else if (entry.intersectionRatio >= .25) entry.target.classList.add("has-entered");
      }
    }, { threshold: [0, .25] });
    portfolio.querySelectorAll("[data-reveal], [data-words], [data-rectangles]").forEach((element) => reveal.observe(element));
    portfolio.querySelectorAll("[data-display]").forEach((element) => letters.observe(element));
    map?.addEventListener("pointermove", tiltMap);
    map?.addEventListener("pointerleave", resetMap);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      reveal.disconnect();
      letters.disconnect();
      delete portfolio.dataset.motion;
      map?.removeEventListener("pointermove", tiltMap);
      map?.removeEventListener("pointerleave", resetMap);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}

export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState("inicio");

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    }, { rootMargin: "-40% 0px -50% 0px" });

    for (const { id } of sections) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="section-nav" aria-label="Seções do portfólio">
      {sections.map(({ id, label }) => (
        <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

export function MotionVideo({ src, className, poster }: { src: string; className?: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visible = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= .35 && !preference.matches) void video.play().catch(() => {});
      else video.pause();
    }, { threshold: .35 });
    const update = () => {
      visible.unobserve(video);
      visible.observe(video);
    };

    update();
    preference.addEventListener("change", update);
    return () => {
      visible.disconnect();
      preference.removeEventListener("change", update);
      video.pause();
    };
  }, []);

  return <video ref={ref} src={sitePath(src)} className={className} poster={sitePath(poster)} muted loop playsInline preload="none" aria-hidden="true" />;
}

export function FeaturedStack({ projects, linkLabel, onVisit }: { projects: Project[]; linkLabel: string; onVisit(id: string): void }) {
  const [front, setFront] = useState(0);
  const active = projects[front];
  const moving = useRef<Animation | null>(null);
  const trigger = useRef<HTMLDivElement>(null);

  const cycle = useCallback(async (button: HTMLDivElement) => {
    if (moving.current || projects.length < 2) return;
    const next = (front + 1) % projects.length;
    const outgoing = button.querySelector<HTMLElement>(`[data-depth="0"]`);
    if (!outgoing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFront(next);
      return;
    }

    button.dataset.cycling = "true";
    outgoing.dataset.departing = "true";
    const ease = "cubic-bezier(.45, 0, .26, 1)";
    const offStack = { translate: "24% -16%", rotate: "3deg" };
    const departure = outgoing.animate([{ translate: "0 0", rotate: "0deg" }, offStack],
      { duration: 425, easing: ease, fill: "forwards" });
    moving.current = departure;

    try {
      await departure.finished;
      setFront(next);
      const arrival = outgoing.animate([offStack, { translate: "0 0", rotate: "0deg" }],
        { duration: 570, easing: ease, fill: "forwards" });
      moving.current = arrival;
      departure.cancel();
      await arrival.finished;
      arrival.cancel();
    } catch {
      // Animation may be cancelled if the button is removed during navigation.
    } finally {
      delete button.dataset.cycling;
      delete outgoing.dataset.departing;
      moving.current = null;
    }
  }, [front, projects.length]);

  useEffect(() => {
    const button = trigger.current;
    if (!button) return;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .35 });
    observer.observe(button);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (visible && !document.hidden && !reduced.matches
        && !button.closest(".featured-stack")?.matches(":hover, :focus-within")) void cycle(button);
    }, 3400);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [cycle]);

  return (
    <div className="featured-stack">
      <div className="poster-stack" ref={trigger}>
        <button type="button" className="stack-trigger"
          onClick={() => { if (trigger.current) void cycle(trigger.current); }}
          aria-label={`Trocar projeto em destaque. Atual: ${active.featuredLabel}`} />
        {projects.map((project, index) => (
          <span
            key={project.id}
            className={`poster-card artwork-${project.number}`}
            data-depth={(index - front + projects.length) % projects.length}
            aria-hidden="true"
          >
            <Image src={project.frames[0].image.src} alt="" fill draggable={false}
              sizes="(max-width: 700px) 25vw, 265px" loading={index < 3 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} />

            {project.frames[0].video && index === front && (
              <MotionVideo src={project.frames[0].video} poster={project.frames[0].image.src} />
            )}

          </span>
        ))}
      </div>
      <a className="featured-link" href={`#${active.id}`} onClick={(event) => {
        if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onVisit(active.id);
      }}>{linkLabel} <ArrowIcon /></a>
      <span className="sr-only" aria-live="polite">{active.featuredLabel}</span>
    </div>
  );
}

export function ArrowIcon({ down = false }: { down?: boolean }) {
  return (
    <svg className="inline-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d={down ? "M10 3v13m-5-5 5 5 5-5" : "M4 16 16 4M7 4h9v9"} />
    </svg>
  );
}

export function MarkIcon() {
  return (
    <svg className="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
    </svg>
  );
}

function SkillIcon({ index }: { index: number }) {
  const marks = [
    <path key="strategy" d="M12 2a10 10 0 1 0 10 10H12zM14 2.2V10h7.8a10 10 0 0 0-7.8-7.8Z" fill="currentColor" stroke="none" />,
    <g key="management"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></g>,
    <path key="design" d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5" />,
    <path key="video" d="m12 2 10 10-10 10L2 12Zm0 6 4 4-4 4-4-4Z" />,
  ];
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{marks[index]}</svg>;
}

export function DisplayLetters({ text, spaced = false }: { text: string; spaced?: boolean }) {
  return (
    <span className="display-letters" data-display>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.toLocaleUpperCase("pt-BR").split(" ").map((word, wordIndex) => (
          <span key={wordIndex} className="display-word">
            {Array.from(word, (letter, index) => {
              const accent = (index + wordIndex * 2) % 5 === 1;
              const gap = spaced && letter === "T" && word[index - 1] === "E";
              if (!accent && !gap) return letter;
              return <span key={index} className={`${accent ? "display-accent" : ""}${gap ? " display-letter-gap" : ""}`}
                style={accent ? { animationDelay: `${(index % 4) * 95}ms` } : undefined}>{letter}</span>;
            })}
          </span>
        ))}
      </span>
    </span>
  );
}

export function SectionDisclosure({ title, titleId, wide, showInPreview, children }: {
  title: string;
  titleId: string;
  wide?: boolean;
  showInPreview: boolean;
  children: ReactNode;
}) {
  const summary = useRef<HTMLElement>(null);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const advancing = useRef(new WeakMap<HTMLElement, Animation>());
  useEffect(() => {
    if (showInPreview && disclosure.current) disclosure.current.open = true;
  }, [showInPreview]);
  useEffect(() => {
    const element = summary.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      element.toggleAttribute("data-hint-visible", entry.isIntersecting);
    }, { threshold: .35 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.removeAttribute("data-hint-visible");
    };
  }, []);

  function toggle() {
    const accents = Array.from(summary.current?.querySelectorAll<HTMLElement>(".display-accent") ?? []);
    const first = accents[0];
    if (first && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const pose = getComputedStyle(first).transform;
      const leaning = pose !== "none" && Math.abs(new DOMMatrixReadOnly(pose).c) > .15;
      for (const letter of accents) {
        const cycle = letter.getAnimations().find((animation) =>
          animation instanceof CSSAnimation && animation.animationName === "letter-lean");
        const timing = cycle?.effect?.getTiming();
        if (!cycle || !timing || typeof timing.duration !== "number") continue;

        const from = getComputedStyle(letter).transform;
        advancing.current.get(letter)?.cancel();
        cycle.pause();
        cycle.currentTime = (timing.delay ?? 0) + timing.duration * (leaning ? .08 : .49);
        const advance = letter.animate([{ transform: from }, { transform: leaning ? "skewX(0deg)" : "skewX(-18deg)" }], {
          duration: 430,
          easing: "cubic-bezier(.2,.65,.3,1)",
          fill: "both",
        });
        advancing.current.set(letter, advance);
        advance.onfinish = () => {
          if (advancing.current.get(letter) !== advance) return;
          advancing.current.delete(letter);
          advance.cancel();
          if (letter.getAnimations().includes(cycle)) cycle.play();
        };
      }
    }
  }

  return <details className="section-disclosure-root" ref={disclosure} data-preview-open={showInPreview || undefined} suppressHydrationWarning>
    <summary className="section-disclosure" ref={summary} onClick={() => requestAnimationFrame(toggle)}>
      <h2 id={titleId} className={`section-title ${wide ? "large-display" : "content-width"}`}><DisplayLetters text={title} spaced={!wide} /></h2>
      <span className="section-disclosure-toggle" aria-hidden="true">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M5 12h14" /><path className="disclosure-cross" d="M12 5v14" />
        </svg>
      </span>
      <span className="section-disclosure-hint" aria-hidden="true">Clique para expandir</span>
    </summary>
    <div className="section-disclosure-inner">{children}</div>
  </details>;
}

export function CopyEmail({ email, greeting, display, copied: copiedMessage }: { email: string; greeting: string; display: string; copied: string }) {
  const [status, setStatus] = useState("");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const field = document.createElement("textarea");
      const active = document.activeElement;
      field.value = email;
      field.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (active instanceof HTMLElement) active.focus({ preventScroll: true });
      if (!copied) {
        setStatus(`Copie o e-mail: ${email}`);
        return;
      }
    }
    window.clearTimeout(timer.current);
    setStatus(copiedMessage);
    timer.current = window.setTimeout(() => setStatus(""), 3200);
  };

  return (
    <div className="email-action">
      <button type="button" className="contact-link" aria-label="Copiar e-mail de André Calazans" onClick={() => { void copy(); }}>
        <span className="email-label" data-active={!status}><span>{greeting}</span><strong>{display}</strong></span>
        <span className="email-feedback" data-active={Boolean(status)} key={status}>{status}</span>
      </button>
      <span className="sr-only" role="status">{status}</span>
    </div>
  );
}

export function WordReveal({ text }: { text: string }) {
  return (
    <span className="word-sequence" data-words>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, index) => (
          <span className="word" key={index} style={{ animationDelay: `${index * 34}ms` }}>{word}{" "}</span>
        ))}
      </span>
    </span>
  );
}

export function SkillCard({ title, description, icon }: { title: string; description: string; icon: number }) {
  const [expanded, setExpanded] = useState(false);
  const descriptionId = useId();

  return (
    <div
      className="skill-card"
      data-reveal
      data-expanded={expanded}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
        const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
        event.currentTarget.style.setProperty("--tilt-x", `${-y * 13}deg`);
        event.currentTarget.style.setProperty("--tilt-y", `${x * 13}deg`);
        event.currentTarget.style.setProperty("--tilt-z", `${x * 3}deg`);
      }}
      onPointerLeave={(event) => {
        for (const axis of ["x", "y", "z"]) event.currentTarget.style.removeProperty(`--tilt-${axis}`);
      }}
    >
      <div className="skill-face">
        <button type="button" aria-expanded={expanded} aria-controls={descriptionId} onClick={() => setExpanded(!expanded)}>
          <SkillIcon index={icon} />{title}
        </button>
        <div id={descriptionId} className="skill-description" aria-hidden={!expanded}><p>{description}</p></div>
      </div>
    </div>
  );
}

export function ProjectGallery({ project, detailLabel, filmLabel, previewFrame }: {
  project: Project;
  detailLabel: string;
  filmLabel: string;
  previewFrame?: number;
}) {
  const [selected, setSelected] = useState(0);
  const [nearViewport, setNearViewport] = useState(false);
  const article = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; scroll: number; index: number; time: number } | null>(null);
  const motionFrame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(motionFrame.current), []);
  useEffect(() => {
    const element = article.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearViewport(true);
      observer.disconnect();
    }, { rootMargin: "900px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (previewFrame === undefined) return;
    const container = track.current;
    const slideIndex = previewFrame === -1 ? 1 : previewFrame === 0 ? 0 : previewFrame + 1;
    const slide = container?.children[slideIndex] as HTMLElement | undefined;
    if (container && slide) {
      container.scrollTo({ left: slide.offsetLeft - (container.children[0] as HTMLElement).offsetLeft, behavior: "instant" });
    }
  }, [previewFrame]);
  const frames = [project.frames[0], null, ...project.frames.slice(1)];
  const frameLabel = (index: number) => frames[index]?.label ?? detailLabel;
  const nearest = (container: HTMLDivElement) => {
    const first = container.children[0] as HTMLElement;
    const second = container.children[1] as HTMLElement;
    return Math.max(0, Math.min(frames.length - 1, Math.round(container.scrollLeft / (second.offsetLeft - first.offsetLeft))));
  };

  const select = (index: number) => {
    const container = track.current;
    const slide = container?.children[index] as HTMLElement | undefined;
    if (!container || !slide) return;
    cancelAnimationFrame(motionFrame.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = container.scrollLeft;
    const target = slide.offsetLeft - (container.children[0] as HTMLElement).offsetLeft;
    delete container.dataset.dragging;
    if (reduced || Math.abs(target - start) < 1) {
      delete container.dataset.animating;
      container.scrollLeft = target;
      return;
    }

    container.dataset.animating = "true";
    const started = performance.now();
    const duration = Math.min(880, 435 + Math.abs(target - start) * .46);
    const tick = (time: number) => {
      const progress = Math.min(1, (time - started) / duration);
      const eased = .5 - Math.cos(Math.PI * progress) / 2;
      container.scrollLeft = start + (target - start) * eased;
      if (progress < 1) motionFrame.current = requestAnimationFrame(tick);
      else delete container.dataset.animating;
    };
    motionFrame.current = requestAnimationFrame(tick);
  };

  return (
    <article ref={article} className="project" id={project.id} data-reveal>
      <div
        className="project-track"
        ref={track}
        role="region"
        aria-label={`Galeria de ${project.title}`}
        tabIndex={0}
        onScroll={(event) => {
          const container = event.currentTarget;
          setSelected(nearest(container));
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
          event.preventDefault();
          select(selected + (event.key === "ArrowLeft" ? -1 : 1));
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          if (event.target instanceof Element && event.target.closest("video, a")) return;
          const container = event.currentTarget;
          dragStart.current = { x: event.clientX, scroll: container.scrollLeft, index: nearest(container), time: performance.now() };
        }}
        onPointerMove={(event) => {
          const container = event.currentTarget;
          if (event.pointerType === "mouse") {
            const bounds = container.getBoundingClientRect();
            container.style.setProperty("--gallery-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 46}px`);
            container.style.setProperty("--gallery-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 32}px`);
          }
          const start = dragStart.current;
          if (!start) return;
          const delta = start.x - event.clientX;
          if (Math.abs(delta) < 5 && event.currentTarget.dataset.dragging !== "true") return;
          if (container.dataset.dragging !== "true") {
            cancelAnimationFrame(motionFrame.current);
            container.setPointerCapture(event.pointerId);
            container.dataset.dragging = "true";
          }
          event.currentTarget.scrollLeft = start.scroll + delta;
        }}
        onPointerLeave={(event) => {
          event.currentTarget.style.removeProperty("--gallery-x");
          event.currentTarget.style.removeProperty("--gallery-y");
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) dragStart.current = null;
        }}
        onPointerUp={(event) => {
          const container = event.currentTarget;
          const start = dragStart.current;
          dragStart.current = null;
          if (!start || container.dataset.dragging !== "true") return;

          const distance = start.x - event.clientX;
          const speed = Math.abs(distance) / Math.max(1, performance.now() - start.time);
          const moved = Math.abs(distance) > Math.min(95, container.clientWidth * .17)
            || (Math.abs(distance) > 22 && speed > .36);
          const index = moved ? start.index + Math.sign(distance) : start.index;
          select(Math.max(0, Math.min(frames.length - 1, index)));
        }}
        onLostPointerCapture={(event) => {
          const container = event.currentTarget;
          dragStart.current = null;
          if (container.dataset.dragging !== "true") return;
          select(nearest(container));
        }}
      >
        {frames.map((frame, index) => {
          const nearSlide = nearViewport && (index === 0 || Math.abs(index - selected) <= 1 || (selected === 0 && index === 2));
          const loading = nearSlide ? "eager" : "lazy";
          return (
          <div key={frameLabel(index)} className={`project-frame ${frame ? `artwork-${project.number}` : "project-detail"}`} aria-hidden={index !== selected}
            onClick={() => { if (!dragStart.current && index !== selected) select(index); }}>
            {!frame ? (
              <div className="project-detail-copy">
                <span>{project.area}</span>
                <h4>{project.title}</h4>
                <p>{project.summary}</p>
                {project.filmUrl && (
                  <a className="case-film-link" href={project.filmUrl} target="_blank" rel="noopener noreferrer" tabIndex={index === selected ? 0 : -1}>
                    {filmLabel} <ArrowIcon />
                  </a>
                )}
              </div>
            ) : frame.companion && frame.video ? (
              <div className={`case-pair case-pair-${frame.companion.theme}`}>
                <div className="case-pair-media">
                  {index === selected
                    ? <MotionVideo className="case-video" src={frame.video} poster={frame.image.src} />
                    : <Image src={frame.image.src} alt={frame.image.alt} fill draggable={false} sizes="38vw" loading={loading} />}
                </div>
                <div className="case-pair-copy">
                  {frame.companion.image
                    ? <Image src={frame.companion.image.src} alt={frame.companion.image.alt} fill draggable={false} sizes="40vw" loading={loading} />
                    : <strong>{frame.companion.title}</strong>}
                </div>
              </div>
            ) : frame.video && index === selected ? (
              <MotionVideo className="case-video" src={frame.video} poster={frame.image.src} />
            ) : (
              <Image className="case-image" src={frame.image.src} alt={frame.image.alt} fill draggable={false} sizes="(max-width: 700px) 82vw, 76vw" loading={loading} />
            )}
          </div>
        )})}
      </div>
      <div className="project-bar">
        <h3>{project.title}</h3>
        <div className="gallery-controls" role="group" aria-label={`Quadros de ${project.title}`}>
          <button type="button" onClick={() => select(selected - 1)} disabled={selected === 0} aria-label="Anterior">←</button>
          {frames.map((_, index) => (
            <button key={frameLabel(index)} type="button" className="gallery-dot" aria-label={frameLabel(index)}
              aria-pressed={index === selected} onClick={() => select(index)} />
          ))}
          <button type="button" onClick={() => select(selected + 1)} disabled={selected === frames.length - 1} aria-label="Próximo">→</button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{frameLabel(selected)}</p>
      <p className="project-area">{project.area}</p>
      <p className="project-summary">{project.summary}</p>
    </article>
  );
}
