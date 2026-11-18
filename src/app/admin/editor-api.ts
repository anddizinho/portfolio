import { backend, type PageName } from "../site-data";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm",
};

export async function uploadMedia(file: File) {
  const extension = extensions[file.type];
  if (!extension || !file.size || file.size > 25 * 1024 * 1024) throw new Error("Envie uma imagem ou vídeo aceito de até 25 MB.");
  const bucket = backend().storage.from("portfolio-media");
  const name = `${crypto.randomUUID()}.${extension}`;
  const { error } = await bucket.upload(name, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  return bucket.getPublicUrl(name).data.publicUrl;
}

export async function savePage(page: PageName, content: unknown, revision: string | null) {
  if (!revision) throw new Error("O conteúdo inicial ainda não foi importado. Recarregue o painel após a importação.");
  const { data, error } = await backend().from("published_pages")
    .update({ content, revision: crypto.randomUUID() }).eq("page", page).eq("revision", revision).select("revision").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Outra edição foi salva ou a sessão expirou. Recarregue o painel antes de tentar novamente.");
  return data.revision as string;
}
