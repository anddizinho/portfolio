type Profile = {
  name: string;
  email: string;
  linkedin: string;
  instagram?: string;
  behance?: string;
  booking?: string;
  logoVideo?: string;
  location: string;
  intro: string;
};

export const profile: Profile = {
  name: "André Calazans",
  email: "andrecalazansneto@gmail.com",
  linkedin: "https://www.linkedin.com/in/andr%C3%A9calazans/",
  location: "Liberdade, São Paulo",
  behance: "https://www.behance.net/andrecalazans",
  instagram: "https://www.instagram.com/xandriellyxandon/?__pwa=1",
  booking: "https://calendly.com/andrecalazansneto/30min",
  intro: "Atuo em estratégia de conteúdo, design e gestão de projetos criativos. Meu trabalho passa por pesquisa de tendências, vídeo curto, direção de arte e produção audiovisual.",
};

export type ProjectFrame = {
  label: string;
  image: { src: string; alt: string };
  video?: string;
  companion?: {
    theme: "molico" | "cafe" | "tokstok";
    title: string;
    image?: { src: string; alt: string };
  };
};

export type Project = {
  id: string;
  number: string;
  title: string;
  area: string;
  summary: string;
  frames: ProjectFrame[];
  filmUrl?: string;
  featuredLabel: string;
};

const media = "/sites/portfolio/cases";
const frame = (label: string, filename: string, alt: string, video?: string, companion?: ProjectFrame["companion"]): ProjectFrame => ({
  label,
  image: { src: `${media}/${filename}.webp`, alt },
  ...(video && { video: `${media}/${video}.mp4` }),
  ...(companion && { companion }),
});

export const projects: Project[] = [
  {
    id: "audicoes-nacionais",
    number: "01",
    featuredLabel: "Audições Nice House",
    title: "Audições Nice House",
    area: "Nice House · Coordenação de conteúdo e liderança criativa",
    summary: "Coordenei a equipe de criação do projeto nacional de seleção de criadores e liderei o trabalho de conteúdo para dar forma à edição e aos desafios. A galeria inclui um panorama histórico de outras edições apresentado pela Nice House.",
    frames: [
      frame("Capa", "nice-audicoes-shared", "Audições Nice House, com o logo sobre uma foto do grupo"),
      frame("O hub", "nice-hub", "Apresentação da Nice House como hub de vídeos curtos"),
      frame("Histórico das edições", "audicoes-historico", "Indicadores históricos das edições de 2020 e 2021 e dos desafios patrocinados"),
      frame("Criadores", "nice-criadores", "Peça da Nice House com fotografia de criadores"),
      frame("Iniciativas do hub", "nice-iniciativas", "Panorama de projetos e colaborações da Nice House"),
    ],
  },
  {
    id: "picpay-empresas",
    number: "02",
    featuredLabel: "PicPay Empresas",
    title: "Ei, PJ. Tamo Junto!",
    area: "PicPay Empresas · BETC HAVAS · Direção de arte",
    summary: "A campanha criada pela equipe da BETC HAVAS aproximou o PicPay da rotina de quem empreende, com foco na abertura de contas PJ. Na direção de arte, trabalhei na comunicação visual e nos desdobramentos digitais da conta.",
    filmUrl: "https://www.youtube.com/watch?v=47pfymKdljw",
    frames: [
      frame("Capa", "picpay-stories", "Imagem de abertura do filme de PicPay Empresas", "picpay-filme"),
      frame("Stories", "picpay-stories", "Quatro peças de Stories de PicPay Empresas aplicadas em celulares"),
      frame("Página da campanha", "picpay-site", "Página de PicPay Empresas aplicada em um notebook"),
      frame("Você é PJ?", "picpay-horizontal", "Adaptação horizontal da peça Você é PJ?, da campanha PicPay Empresas"),
    ],
  },
  {
    id: "nice-trip-2022",
    number: "02",
    featuredLabel: "Nice Trip 2022",
    title: "Nice Trip 2022",
    area: "Nice House · Direção criativa em equipe",
    summary: "Integrei a direção criativa da Nice Trip 2022, coordenando conteúdos, criadores e entregas para parceiros. A operação incluiu colaborações internacionais, uma visita à Disneyland Paris e uma passagem pelo Rock in Rio.",
    frames: [
      frame("Identidade da viagem", "trip-wide", "Capa horizontal da Nice Trip 2022 com a identidade original em fundo espacial"),
      frame("Roteiro", "trip-route-centered", "Logo centralizado da Nice Trip e roteiro em três paradas: Milão, Paris e Rio de Janeiro"),
    ],
  },
  {
    id: "nice-trend-talks",
    number: "03",
    featuredLabel: "Nice Trend Talks",
    title: "Nice Trend Talks",
    area: "Nice House · Direção criativa e mediação",
    summary: "Conduzi um painel da série que colocava criadores e marcas em diálogo sobre a creator economy. Com Jand, Andreza Delgado e Os Banheiristas, discuti protagonismo de pessoas negras, presença de povos originários e diversidade de gênero e sexualidade na publicidade brasileira.",
    frames: [
      frame("Capa", "trend-wide", "Logo roxo da Nice Trend Talks sobre fundo amarelo"),
      frame("André no palco", "trend-palco", "André Calazans com o microfone no palco da Nice Trend Talks"),
    ],
  },
  {
    id: "batalha-de-looks",
    number: "01",
    featuredLabel: "Batalha de Looks",
    title: "Batalha de Looks",
    area: "Mercado Livre Moda · Nice House · Gestão de criação e de conta",
    summary: "Contribuí para criar partes do formato da competição, que reuniu criadoras de moda, beleza e lifestyle em desafios de vídeo vertical para revelar uma integrante do Meli Fashion Squad. O material do projeto registra 17 criadoras ativas e 129 publicações em 30 dias.",
    frames: [
      frame("Capa", "looks-capa", "Identidade da Batalha de Looks do Mercado Livre Moda"),
      frame("Números do projeto", "looks-big-numbers", "Resultados da Batalha de Looks em mosaico com a faixa rosa: 17 criadoras ativas, 129 publicações e 30 dias"),
    ],
  },
  {
    id: "house-nestle",
    number: "02",
    featuredLabel: "House Nestlé",
    title: "House Nestlé",
    area: "Direção de arte · Embalagem, key visuals e motion",
    summary: "Na House Nestlé, desenvolvi peças para diferentes marcas e formatos. Criei a embalagem e montei o key visual de Baton Buttons, criei o visual do podcast Para Você!, da Nescau, e produzi peças de Natal para Nestlé Até Você. A seleção inclui o Dia Internacional do Café com Nescafé e Starbucks e os desdobramentos de Molico em Stories e materiais offline.",
    frames: [
      frame("Molico · Stories", "molico-motion-poster", "Motion de Stories de Molico", "molico-motion", { theme: "molico", title: "Molico", image: { src: `${media}/molico-side.webp`, alt: "Logotipo Nestlé Molico sobre fundo azul" } }),
      frame("Baton Buttons · Embalagem e KV", "baton", "Copo de Baton Buttons com chocolate e leite sobre fundo azul"),
      frame("Nescau · Para Você!", "nescau-wide", "Key visual vermelho do podcast Para Você!, da Nescau"),
      frame("Nestlé Até Você · Natal", "natal-wide", "Peça de Natal da Nestlé Até Você em verde com enfeites e presentes"),
      frame("Dia Internacional do Café", "cafe-wide", "Peça com produtos Nescafé, Dolce Gusto e Starbucks"),
      frame("Nescafé e Starbucks · Motion", "cafe-motion-poster", "Motion de Nescafé e Starbucks", "cafe-motion", { theme: "cafe", title: "Dia Internacional do Café" }),
      frame("Molico · Key visual", "molico-kv", "Key visual de Molico com fundo azul e branco e embalagem do produto"),
      frame("Molico · Aplicações offline", "molico-offline-wide", "Mockups de brindes e de aplicação em toldo para Molico"),
    ],
  },
  {
    id: "jimmy-the-bull",
    number: "01",
    featuredLabel: "Tok&Stok",
    title: "Tok&Stok",
    area: "Tok&Stok · Agência Ginga · Direção de arte",
    summary: "Fiz a direção de arte da campanha digital de lançamento da coleção Jimmy The Bull, criada com o artista Rafael Mantesso. Trabalhei em parceria com a redatora Raquel Machado para levar o universo do personagem às peças da coleção. A galeria também traz uma seleção de outras peças e vídeos da Tok&Stok.",
    frames: [
      frame("Ana Strumpf", "tokstok-ana", "Vídeo com a ilustradora e designer Ana Strumpf", "tokstok-ana"),
      frame("Jimmy The Bull", "jimmy-capa", "Frame do vídeo da coleção Jimmy The Bull", "jimmy-motion", { theme: "tokstok", title: "Jimmy The Bull" }),
      frame("Pets em casa", "tokstok-pets", "Vídeo da Tok&Stok sobre dividir a casa com os pets", "tokstok-pets"),
      frame("Best Friday", "tokstok-best-wide", "Peça Best Friday da Tok&Stok com luminária e mesa de cabeceira"),
    ],
  },
];

export const experience = [
  ["Canva", "Content Designer", "Abr. 2026 – atual"],
  ["ByteDance", "Viral Content Specialist", "Set. 2025 – abr. 2026"],
  ["Nice House", "Gerente de contas pleno e sênior", "Jan. 2023 – mai. 2025"],
  ["Final Level Co", "Coordenador de conteúdo", "Mar. 2022 – jan. 2023"],
  ["Agência Ginga", "Diretor de arte e conteúdo", "Abr. 2021 – mar. 2022"],
  ["All Set Comunicação", "Diretor de arte · House Nestlé", "Out. 2019 – mar. 2021"],
  ["Nice House", "Criação de conteúdo", "Jul. 2020 – nov. 2020"],
];

export const skills = [
  ["Estratégia de conteúdo", "Pesquisa de tendências, marketing digital e vídeo curto."],
  ["Gestão de projetos", "Gestão de contas e projetos com marcas e criadores."],
  ["Design e direção de arte", "Design de conteúdo, direção de arte e criação visual."],
  ["Audiovisual", "Produção, fotografia e filmmaking."],
];

export const aiSkills = [
  "Higgsfield",
  "Seedance 2.0",
  "Claude Code · GPT Codex",
  "Otimização de tarefas com inteligência artificial",
];

export const brands = [
  ["BIS", "Direção criativa"],
  ["Oi", "Direção de arte"],
  ["TikTok", "Gerência de conta · TTCX"],
  ["Warner Bros.", "Gerência de conta"],
  ["Americanas", "Gerência de conta"],
  ["Mercado Livre", "Gerência de criação e de conta"],
  ["PicPay", "Direção de arte · BETC HAVAS"],
  ["Moça", "Direção de arte"],
  ["Nestlé", "Direção de arte · House Nestlé"],
  ["Nescau", "Direção de arte"],
  ["Garoto", "Embalagem e key visual · Baton Buttons"],
  ["Molico", "Direção de arte e motion"],
  ["Nescafé", "Direção de arte e motion"],
  ["Starbucks", "Direção de arte e motion"],
  ["Tok&Stok", "Direção de arte · Jimmy The Bull"],
  ["Canva", "Consultoria de design de conteúdo"],
  ["CapCut Brasil", "Liderança de programa de criadores · MultIAverso"],
  ["Ambev", "Colaboração em projetos"],
  ["Lacta", "Colaboração em projetos"],
  ["ibis", "Parceria em audições"],
  ["Lemon Cash", "Parceria em desafio das audições"],
  ["Rock in Rio", "Parceiro citado na Nice Trip"],
] as const;
