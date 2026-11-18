const address = process.env.NEXT_PUBLIC_SITE_URL;

export function siteUrl(path: string) {
  return address ? address.replace(/\/$/, "") + path : undefined;
}
