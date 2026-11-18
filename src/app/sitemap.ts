import type { MetadataRoute } from "next";
import { siteUrl } from "./site-metadata";

export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/bio/"].flatMap((path) => {
    const url = siteUrl(path);
    return url ? [{ url }] : [];
  });
}
