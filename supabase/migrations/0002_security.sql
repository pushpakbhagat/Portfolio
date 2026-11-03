-- Row Level Security.
-- Visitors (anon key) can read published / visible content only. Admins (rows in admin_users)
-- can read and write everything. Contact submissions are inserted by the server with the
-- service role after validation and rate limiting, so there is deliberately no insert policy.

-- Explicit grants, so the API roles' access never depends on project defaults. RLS below is what
-- actually limits each role.
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.set_technologies(text, uuid, text[]) to authenticated;
grant execute on function public.reorder(text, uuid[]) to authenticated;
revoke execute on function public.log_activity() from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'admin_users', 'profile', 'site_settings', 'admin_settings', 'social_links', 'skill_categories',
    'skills', 'technologies', 'focus_areas', 'projects', 'project_images', 'project_technologies',
    'education', 'experiences', 'experience_technologies', 'accomplishments', 'documents',
    'featured_repos', 'contact_submissions', 'activity_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Admin full access on every content table.
do $$
declare t text;
begin
  foreach t in array array[
    'profile', 'site_settings', 'admin_settings', 'social_links', 'skill_categories', 'skills',
    'technologies', 'focus_areas', 'projects', 'project_images', 'project_technologies', 'education',
    'experiences', 'experience_technologies', 'accomplishments', 'documents', 'featured_repos'
  ] loop
    execute format(
      'create policy "admins manage %1$s" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t
    );
  end loop;
end $$;

-- Public reads
create policy "public reads profile" on public.profile for select using (true);
create policy "public reads site settings" on public.site_settings for select using (true);
create policy "public reads technologies" on public.technologies for select using (true);

do $$
declare t text;
begin
  foreach t in array array[
    'social_links', 'skill_categories', 'skills', 'focus_areas', 'education', 'experiences',
    'accomplishments', 'featured_repos'
  ] loop
    execute format('create policy "public reads visible %1$s" on public.%1$I for select using (is_visible)', t);
  end loop;
end $$;

create policy "public reads published projects" on public.projects
  for select using (publish_status = 'published');

create policy "public reads images of published projects" on public.project_images
  for select using (exists (
    select 1 from public.projects p where p.id = project_id and p.publish_status = 'published'
  ));

create policy "public reads technologies of published projects" on public.project_technologies
  for select using (exists (
    select 1 from public.projects p where p.id = project_id and p.publish_status = 'published'
  ));

create policy "public reads technologies of visible jobs" on public.experience_technologies
  for select using (exists (
    select 1 from public.experiences e where e.id = experience_id and e.is_visible
  ));

create policy "public reads public documents of visible entries" on public.documents
  for select using (
    bucket = 'public-assets' and (
      exists (select 1 from public.education x where x.id = education_id and x.is_visible)
      or exists (select 1 from public.experiences x where x.id = experience_id and x.is_visible)
      or exists (select 1 from public.accomplishments x where x.id = accomplishment_id and x.is_visible)
    )
  );

-- Admin-only tables
create policy "admins read admins" on public.admin_users
  for select to authenticated using ((select public.is_admin()));

create policy "admins read messages" on public.contact_submissions
  for select to authenticated using ((select public.is_admin()));
create policy "admins update messages" on public.contact_submissions
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete messages" on public.contact_submissions
  for delete to authenticated using ((select public.is_admin()));

create policy "admins read activity" on public.activity_log
  for select to authenticated using ((select public.is_admin()));

-- Storage -----------------------------------------------------------------------------------------
-- public-assets: photos, thumbnails, screenshots, logos, icons, resume. Readable by anyone through
-- public URLs. private-documents: files only admins may open (served with short-lived signed URLs).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 10485760, array[
    'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml', 'image/x-icon',
    'image/vnd.microsoft.icon', 'application/pdf'
  ]),
  ('private-documents', 'private-documents', false, 10485760, array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp'
  ])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admins upload portfolio files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('public-assets', 'private-documents') and (select public.is_admin()));

create policy "admins update portfolio files" on storage.objects
  for update to authenticated
  using (bucket_id in ('public-assets', 'private-documents') and (select public.is_admin()));

create policy "admins delete portfolio files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('public-assets', 'private-documents') and (select public.is_admin()));

create policy "admins read portfolio files" on storage.objects
  for select to authenticated
  using (bucket_id in ('public-assets', 'private-documents') and (select public.is_admin()));
