# Portfólio no GitHub Pages

O portfólio, a Bio e a interface de edição são exportados para `out/`. O Supabase guarda as páginas publicadas e os uploads. A pasta do GPT Sites é independente.

## Supabase

- `supabase/bootstrap.sql` cria as tabelas, o bucket público de mídia e as permissões de escrita limitadas aos editores.
- `node scripts/pages-seed.mjs` gera o SQL da importação inicial a partir das duas cópias do conteúdo publicado. A importação preserva linhas que já existem.
- Configure o provedor GitHub no Supabase com a credencial de um GitHub OAuth App. O callback do app é `https://alpmfyubjhbvsszzwrqo.supabase.co/auth/v1/callback`. Guarde o Client Secret somente no painel do Supabase.
- Em Authentication → URL Configuration, autorize o retorno exato `https://anddizinho.github.io/portfolio/admin/`. Para validação prévia, autorize também `http://127.0.0.1:4319/portfolio/admin/` e retire essa URL quando a validação terminar.
- Depois do primeiro login, use o ID histórico da conta GitHub para habilitar somente a identidade esperada:

```sql
insert into public.site_editors (user_id)
select user_id from auth.identities
where provider = 'github' and provider_id = '7887352'
on conflict do nothing;
```

## GitHub

Configure o Pages para usar GitHub Actions. Nas variáveis do repositório, configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a URL do projeto e a chave publicável. A chave privada nunca vai para o repositório nem para o pacote estático.

O workflow lê o caminho do Pages, valida a configuração do Supabase, compila com Node 24 e publica o diretório `out/` a cada atualização da branch `main`. Alterações feitas pelo painel são persistidas no Supabase.

Para editar com o Codex, abra o repositório e trabalhe na cópia do GitHub. Rodar `npm ci` e `npm run build` gera o site para conferência. Depois da revisão, atualize a branch `main` para que a publicação automática ocorra.
