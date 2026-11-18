export const socialPlatforms = ["Instagram", "YouTube", "TikTok", "X / Twitter", "SoundCloud"] as const;

export type BioRelease = {
  id: string;
  badge: string;
  caption: string;
  title: string;
  showTitle: boolean;
  image: string;
  alt: string;
  video: string;
  href: string;
  linkText: string;
};

export type BioData = {
  name: string;
  tagline: string;
  description: string;
  location: string;
  email: string;
  backgroundVideo: string;
  backgroundPoster: string;
  socials: Array<{ label: string; url: string }>;
  releases: BioRelease[];
};

export const emptyRelease: Omit<BioRelease, "id"> = {
  badge: "", caption: "", title: "", showTitle: false, image: "", alt: "", video: "", href: "", linkText: "",
};

export const defaultBio: BioData = {
  name: "Chandelier Chandon",
  tagline: "Funk, club e performance. Do palco à pista.",
  description: "Drag queen, performer, DJ, apresentadora e criadora",
  location: "De Aracaju, morando em São Paulo",
  email: "assessoriaxandrielly@gmail.com",
  backgroundVideo: "/sites/bio/motion-tech-funk.mp4",
  backgroundPoster: "/sites/bio/motion-poster.webp",
  socials: [
    { label: "Instagram", url: "https://www.instagram.com/xandriellyxandon" },
    { label: "YouTube", url: "https://www.youtube.com/@Xandriellyxandon" },
    { label: "TikTok", url: "https://www.tiktok.com/@xandriellyxandon" },
    { label: "X / Twitter", url: "https://twitter.com/xandrielyxandon" },
    { label: "SoundCloud", url: "https://on.soundcloud.com/BSxkxTBbEKs1yyrYN6" },
  ],
  releases: [{
    ...emptyRelease,
    id: "funk-x-tech",
    badge: "Out Now",
    caption: "Novo DJset",
    title: "~̮̙͂͑̇F͉ͮ͑Ů̬ͫN̩̝̔ͧ̾K͈̩͐ͮ~̝̃X̥ͥ̕~̝̣̉̃͗T͕ͫÊ̟C̢͙ͬ͌̏H̗ͥ̓~̫ͫ̏R͎͂E̠͓ͦͫM̡̲̅͑̈Ǎ̲͊Š̖T̪͒ͬḘ̌̓ͭR͈͓̈́̏O",
    showTitle: true,
    image: "/sites/bio/cover-funk-x-tech-clear.png",
    alt: "CD em caixa transparente com um retrato de Xandrielly Xandon num cubo de vidro",
    href: "https://on.soundcloud.com/BSxkxTBbEKs1yyrYN6",
    linkText: "Ouvir no SoundCloud",
  }],
};

export function currentBio(content: BioData | null): BioData {
  if (!content) return defaultBio;
  if (typeof content.tagline === "string") return content;
  return {
    ...content,
    tagline: defaultBio.tagline,
    name: content.name === "Xandrielly Xandon" ? defaultBio.name : content.name,
    location: content.location === "De Aracaju morando em SP" ? defaultBio.location : content.location,
    releases: content.releases.map((release) => {
      if (release.id !== "funk-x-tech" || release.image !== "/sites/bio/cover-funk-x-tech.png") return release;
      const updated = defaultBio.releases[0];
      return { ...release, image: updated.image, showTitle: true, caption: release.caption === "Novo set" ? updated.caption : release.caption };
    }),
  };
}
