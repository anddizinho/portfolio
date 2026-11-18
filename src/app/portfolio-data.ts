import { aiSkills, brands, experience, profile, projects, skills } from "./portfolio-content";

export const sectionIds = ["inicio", "projetos", "competencias", "trajetoria", "clientes", "contato"] as const;
export type SectionId = typeof sectionIds[number];

export const defaultPortfolio = {
  profile,
  projects,
  skills: skills.map(([title, description], icon) => ({ title, description, icon })),
  aiSkills,
  experience: experience.map(([company, role, period]) => ({ company, role, period })),
  brands: brands.map(([brand, role]) => ({ brand: String(brand), role: String(role) })),
  sections: [
    { id: "inicio", label: "Início", title: "Conteúdo", subtitle: "— Design", background: "#19163d", titleColor: "#f5f48e", subtitleColor: "#f5f48e" },
    { id: "projetos", label: "Projetos", title: "Projetos", subtitle: "", background: "#24232a", titleColor: "#f5f48e", subtitleColor: "#e0ccff" },
    { id: "competencias", label: "Competências", title: "Competências", subtitle: "& serviços", background: "#19163d", titleColor: "#e0ccff", subtitleColor: "#f5f48e" },
    { id: "trajetoria", label: "Trajetória", title: "Trajetória", subtitle: "", background: "#252244", titleColor: "#f5f48e", subtitleColor: "#e0ccff" },
    { id: "clientes", label: "Clientes", title: "Clientes", subtitle: "", background: "#19163d", titleColor: "#e0ccff", subtitleColor: "#e0ccff" },
    { id: "contato", label: "Contato", title: "Vamos criar", subtitle: "algo juntos?", background: "#19163d", titleColor: "#f5f48e", subtitleColor: "#f5f48e" },
  ] as { id: SectionId; label: string; title: string; subtitle: string; background: string; titleColor: string; subtitleColor: string }[],
  text: {
    logo: "/sites/portfolio/calazans.png",
    portfolio: "Portfólio",
    directionMark: "&",
    directionStart: "Dire",
    directionEnd: "— Ção",
    splitWord: "Design",
    introStatement: "Da pesquisa à execução, conecto estratégia, criação e produção para dar forma a projetos de conteúdo.",
    explore: "Explore",
    moreWork: "Mais trabalhos",
    onBehance: "no Behance",
    creation: "Criação",
    artificialIntelligence: "Inteligência artificial",
    clientsIntro: "Marcas que fizeram parte de projetos e campanhas da minha trajetória.",
    contactIntro: "Da primeira ideia à entrega, trabalho com marcas e equipes para criar conteúdo, campanhas e experiências digitais. Me conta o que você quer construir.",
    greeting: "Olá",
    emailDisplay: "@calazans.com",
    copied: "O e-mail foi copiado",
    availability: "Disponível para novos projetos",
    booking: "Marque um horário",
    projectLink: "Ver projeto",
    projectDetail: "Sobre o projeto",
    filmLink: "Assistir ao filme",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    behance: "Behance",
  },
};
export type Palette = Pick<typeof defaultPortfolio.sections[number], "background" | "titleColor" | "subtitleColor">;
const caseAssets = "/sites/portfolio/cases/";

export function refreshCaseArt(data: PortfolioData): PortfolioData {
  const replacedFiles = new Map([
    ["nice-audicoes-new.webp", "nice-audicoes-shared.webp"],
    ["trip-route-clean.webp", "trip-route-centered.webp"],
    ["looks-clean.webp", "looks-big-numbers.webp"],
    ["looks-results-grid.webp", "looks-big-numbers.webp"],
  ]);
  return {
    ...data,
    projects: data.projects.map((project) => {
      const original = defaultPortfolio.projects.find(({ id }) => id === project.id);
      if (!original) return project;
      if (project.id === "nice-trend-talks" && project.frames.length === 2 &&
        project.frames[0].image.src === caseAssets + "trend-capa-horizontal.webp" &&
        project.frames[1].image.src === caseAssets + "trend-wide.webp") {
        return { ...project, frames: project.frames.map((frame, index) => ({
          ...frame,
          image: original.frames[index].image,
          label: frame.label === "Identidade" && index === 1 ? original.frames[index].label : frame.label,
        })) };
      }
      return { ...project, frames: project.frames.map((frame) => {
        if (!frame.image.src.startsWith(caseAssets)) return frame;
        const file = replacedFiles.get(frame.image.src.slice(caseAssets.length));
        const replacement = file && original.frames.find(({ image }) => image.src === caseAssets + file);
        return replacement ? { ...frame, image: replacement.image } : frame;
      }) };
    }),
  };
}
export type PortfolioData = typeof defaultPortfolio & { palette?: Palette };
