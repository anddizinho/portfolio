import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sitePath } from "./site-path";

let client: SupabaseClient | undefined;
export function backend() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("O Supabase ainda não foi configurado para esta versão.");
  return client ??= createClient(url, key, { auth: { flowType: "pkce" } });
}

export type PageName = "portfolio" | "bio";
export type Published<T> = { content: T | null; revision: string | null };

export async function readPage<T>(page: PageName, signal?: AbortSignal): Promise<Published<T>> {
  const query = backend().from("published_pages").select("content,revision").eq("page", page);
  const { data, error } = await (signal ? query.abortSignal(signal) : query).maybeSingle();
  if (error) throw error;
  return data ? { content: data.content as T, revision: data.revision as string } : { content: null, revision: null };
}

export async function verifyEditor() {
  const { data: { user }, error: authError } = await backend().auth.getUser();
  if (authError || !user) throw new Error("Entre com sua conta GitHub para editar.");
  const { data, error } = await backend().from("site_editors").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !data) throw new Error("Esta conta GitHub não tem acesso de edição.");
}

export async function enterEditor() {
  const { error } = await backend().auth.signInWithOAuth({
    provider: "github", options: { redirectTo: window.location.origin + sitePath("/admin/") },
  });
  if (error) throw error;
}
