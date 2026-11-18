begin;

create table if not exists public.site_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.site_editors enable row level security;
revoke all on public.site_editors from public, anon, authenticated;
grant select on public.site_editors to authenticated;
create policy "Read own editor membership" on public.site_editors
  for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.published_pages (
  page text primary key check (page in ('portfolio', 'bio')),
  content jsonb not null check (
    jsonb_typeof(content) = 'object'
    and octet_length(content::text) <= 750000
    and case page
      when 'portfolio' then content ?& array['profile','projects','sections','text','skills','aiSkills','experience','brands']
      when 'bio' then content ?& array['name','tagline','description','location','email','backgroundVideo','backgroundPoster','socials','releases']
      else false
    end
  ),
  revision uuid not null default gen_random_uuid()
);
alter table public.published_pages enable row level security;
revoke all on public.published_pages from public, anon, authenticated;
grant select on public.published_pages to anon, authenticated;
grant update (content, revision) on public.published_pages to authenticated;
create policy "Read public pages" on public.published_pages
  for select to anon, authenticated using (true);
create policy "Only editors can save pages" on public.published_pages
  for update to authenticated
  using (exists (select 1 from public.site_editors where user_id = (select auth.uid())))
  with check (exists (select 1 from public.site_editors where user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 26214400,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm'])
on conflict (id) do nothing;
create policy "Only editors can upload portfolio media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and name ~ '^[a-f0-9-]{36}\.(jpg|png|webp|avif|gif|mp4|webm)$'
    and exists (select 1 from public.site_editors where user_id = (select auth.uid()))
  );

commit;
