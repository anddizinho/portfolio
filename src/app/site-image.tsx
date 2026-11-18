import Image, { type ImageProps } from "next/image";
import { sitePath } from "./site-path";

export default function SiteImage({ src, alt, ...props }: ImageProps) {
  return <Image {...props} alt={alt} src={typeof src === "string" ? sitePath(src) : src} />;
}
