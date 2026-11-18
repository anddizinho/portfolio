export function sitePath(path: string): string;
export function sitePath(path: string | undefined): string | undefined;
export function sitePath(path: string | undefined) {
  if (!path?.startsWith("/") || path.startsWith("//")) return path;
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + path;
}
