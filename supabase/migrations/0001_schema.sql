-- Portfolio content schema.
-- Every list table has sort_order + is_visible (or publish_status for projects) and timestamps.
-- Free-form values that may grow (statuses, kinds) are text + check constraints rather than enums,
-- so adding a value later is a one-line migration.

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Admins ------------------------------------------------------------------------------------------
-- Only users listed here can manage content. Rows are added by `npm run admin:create`
-- (service role); there is no public sign-up.

create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

-- Singletons --------------------------------------------------------------------------------------

create table public.profile (
  id                 smallint primary key default 1 check (id = 1),
  full_name          text not null default '' check (char_length(full_name) <= 120),
  titles             text[] not null default '{}',
  intro              text not null default '',
  about              text not null default '',
  interests          text not null default '',
  career_goals       text not null default '',
  current_status     text not null default '',
  experience_summary text not null default '',
  location           text not null default '',
  timezone           text not null default '',
  email              text not null default '',
  availability       text not null default 'open' check (availability in ('open', 'limited', 'unavailable')),
  availability_note  text not null default '',
  photo_path         text,
  resume_path        text,
  updated_at         timestamptz not null default now()
);

create table public.site_settings (
  id                       smallint primary key default 1 check (id = 1),
  site_title               text not null default '',
  site_description         text not null default '',
  seo_keywords             text[] not null default '{}',
  og_image_path            text,
  logo_path                text,
  favicon_path             text,
  default_theme            text not null default 'system' check (default_theme in ('system', 'light', 'dark')),
  nav_links                jsonb not null default '[]' check (jsonb_typeof(nav_links) = 'array'),
  footer_text              text not null default '',
  announcement_enabled     boolean not null default false,
  announcement_text        text not null default '',
  announcement_url         text not null default '',
  github_username          text not null default '' check (github_username ~ '^[A-Za-z0-9-]{0,39}$'),
  github_show_activity     boolean not null default true,
  sections                 jsonb not null default '{}' check (jsonb_typeof(sections) = 'object'),
  is_published             boolean not null default true,
  updated_at               timestamptz not null default now()
);

-- Settings visitors must never read (only admins can select this table).
create table public.admin_settings (
  id                 smallint primary key default 1 check (id = 1),
  notification_email text not null default '',
  updated_at         timestamptz not null default now()
);

-- Lists -------------------------------------------------------------------------------------------

create table public.social_links (
  id         uuid primary key default gen_random_uuid(),
  platform   text not null check (char_length(platform) between 1 and 40),
  label      text not null default '',
  url        text not null check (url ~* '^(https?://|mailto:)'),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 60),
  description text not null default '',
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.skills (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.skill_categories (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 60),
  icon_slug   text not null default '' check (icon_slug ~ '^[a-z0-9.-]*$'),
  icon_path   text,
  level       text check (level in ('learning', 'working', 'proficient', 'expert')),
  years       numeric(3, 1) check (years >= 0 and years <= 60),
  note        text not null default '',
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index skills_name_key on public.skills (lower(name));
create index skills_category_idx on public.skills (category_id, sort_order);

create table public.technologies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  icon_slug  text not null default '' check (icon_slug ~ '^[a-z0-9.-]*$'),
  created_at timestamptz not null default now()
);
create unique index technologies_name_key on public.technologies (lower(name));

create table public.focus_areas (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 80),
  description text not null default '',
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 120),
  summary         text not null default '',
  overview        text not null default '',
  problem         text not null default '',
  solution        text not null default '',
  architecture    text not null default '',
  features        text[] not null default '{}',
  challenges      jsonb not null default '[]' check (jsonb_typeof(challenges) = 'array'),
  outcomes        text not null default '',
  category        text not null default '',
  role            text not null default '',
  status          text check (status in ('planned', 'in_progress', 'completed', 'maintained', 'archived')),
  started_on      date,
  ended_on        date,
  is_ongoing      boolean not null default false,
  thumbnail_path  text,
  github_url      text not null default '' check (github_url = '' or github_url ~* '^https?://'),
  live_url        text not null default '' check (live_url = '' or live_url ~* '^https?://'),
  is_featured     boolean not null default false,
  publish_status  text not null default 'draft' check (publish_status in ('draft', 'published')),
  published_at    timestamptz,
  seo_title       text not null default '',
  seo_description text not null default '',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ended_on is null or started_on is null or ended_on >= started_on)
);
create index projects_public_idx on public.projects (publish_status, sort_order);

create table public.project_images (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  path       text not null,
  alt        text not null default '',
  caption    text not null default '',
  width      integer check (width > 0),
  height     integer check (height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index project_images_project_idx on public.project_images (project_id, sort_order);

create table public.project_technologies (
  project_id    uuid not null references public.projects (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  sort_order    integer not null default 0,
  primary key (project_id, technology_id)
);
create index project_technologies_technology_idx on public.project_technologies (technology_id);

create table public.education (
  id             uuid primary key default gen_random_uuid(),
  institution    text not null check (char_length(institution) between 1 and 160),
  degree         text not null check (char_length(degree) between 1 and 160),
  field_of_study text not null default '',
  location       text not null default '',
  started_on     date,
  ended_on       date,
  is_current     boolean not null default false,
  grade          text not null default '',
  description    text not null default '',
  coursework     text[] not null default '{}',
  logo_path      text,
  sort_order     integer not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ended_on is null or started_on is null or ended_on >= started_on),
  check (not (is_current and ended_on is not null))
);

create table public.experiences (
  id               uuid primary key default gen_random_uuid(),
  company          text not null check (char_length(company) between 1 and 160),
  company_url      text not null default '' check (company_url = '' or company_url ~* '^https?://'),
  logo_path        text,
  title            text not null check (char_length(title) between 1 and 160),
  employment_type  text not null default 'full_time'
                   check (employment_type in ('full_time', 'part_time', 'internship', 'trainee', 'freelance', 'contract', 'apprenticeship')),
  work_mode        text check (work_mode in ('onsite', 'remote', 'hybrid')),
  location         text not null default '',
  started_on       date not null,
  ended_on         date,
  is_current       boolean not null default false,
  description      text not null default '',
  responsibilities text[] not null default '{}',
  achievements     text[] not null default '{}',
  sort_order       integer not null default 0,
  is_visible       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ended_on is null or ended_on >= started_on),
  check (not (is_current and ended_on is not null))
);

create table public.experience_technologies (
  experience_id uuid not null references public.experiences (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  sort_order    integer not null default 0,
  primary key (experience_id, technology_id)
);
create index experience_technologies_technology_idx on public.experience_technologies (technology_id);

-- Certifications, courses, hackathons, awards... share one table: their fields are identical.
create table public.accomplishments (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'certification'
                 check (kind in ('certification', 'course', 'hackathon', 'academic', 'award', 'competition', 'other')),
  title          text not null check (char_length(title) between 1 and 160),
  issuer         text not null default '',
  issued_on      date,
  expires_on     date,
  credential_id  text not null default '',
  credential_url text not null default '' check (credential_url = '' or credential_url ~* '^https?://'),
  description    text not null default '',
  image_path     text,
  sort_order     integer not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Supporting files for an education entry, a job or an accomplishment (exactly one of them).
create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  title             text not null check (char_length(title) between 1 and 160),
  bucket            text not null check (bucket in ('public-assets', 'private-documents')),
  path              text not null,
  mime_type         text not null default '',
  size_bytes        integer check (size_bytes >= 0),
  education_id      uuid references public.education (id) on delete cascade,
  experience_id     uuid references public.experiences (id) on delete cascade,
  accomplishment_id uuid references public.accomplishments (id) on delete cascade,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  check (num_nonnulls(education_id, experience_id, accomplishment_id) = 1)
);
create index documents_education_idx on public.documents (education_id);
create index documents_experience_idx on public.documents (experience_id);
create index documents_accomplishment_idx on public.documents (accomplishment_id);

create table public.featured_repos (
  id                   uuid primary key default gen_random_uuid(),
  repo                 text not null unique check (repo ~ '^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$'),
  description_override text not null default '',
  sort_order           integer not null default 0,
  is_visible           boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 254),
  subject    text not null default '' check (char_length(subject) <= 200),
  message    text not null check (char_length(message) between 1 and 5000),
  status     text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  ip_hash    text not null default '',
  user_agent text not null default '',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index contact_submissions_inbox_idx on public.contact_submissions (status, created_at desc);
create index contact_submissions_rate_idx on public.contact_submissions (ip_hash, created_at desc);

create table public.activity_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references auth.users (id) on delete set null,
  action     text not null check (action in ('create', 'update', 'delete')),
  entity     text not null,
  entity_id  text not null default '',
  summary    text not null default '',
  created_at timestamptz not null default now()
);
create index activity_log_recent_idx on public.activity_log (created_at desc);

-- Visible-list indexes
create index social_links_order_idx on public.social_links (is_visible, sort_order);
create index skill_categories_order_idx on public.skill_categories (is_visible, sort_order);
create index focus_areas_order_idx on public.focus_areas (is_visible, sort_order);
create index education_order_idx on public.education (is_visible, sort_order);
create index experiences_order_idx on public.experiences (is_visible, sort_order);
create index accomplishments_order_idx on public.accomplishments (is_visible, sort_order);
create index featured_repos_order_idx on public.featured_repos (is_visible, sort_order);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array[
    'profile', 'site_settings', 'admin_settings', 'social_links', 'skill_categories', 'skills',
    'focus_areas', 'projects', 'education', 'experiences', 'accomplishments', 'featured_repos'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;

-- Activity log -----------------------------------------------------------------------------------
-- Written by trigger so no admin change can skip it. Pure reorders (only sort_order changed) are
-- not logged, otherwise one drag would write a row per item.

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'sort_order' - 'updated_at') = (to_jsonb(old) - 'sort_order' - 'updated_at') then
    return null;
  end if;

  insert into public.activity_log (actor_id, action, entity, entity_id, summary)
  values (
    (select auth.uid()),
    case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
    tg_table_name,
    coalesce(rec ->> 'id', ''),
    left(coalesce(
      rec ->> 'title', rec ->> 'name', rec ->> 'company', rec ->> 'institution',
      rec ->> 'platform', rec ->> 'repo', rec ->> 'full_name', rec ->> 'site_title', ''
    ), 160)
  );
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profile', 'site_settings', 'social_links', 'skill_categories', 'skills', 'focus_areas',
    'projects', 'project_images', 'education', 'experiences', 'accomplishments', 'documents', 'featured_repos'
  ] loop
    execute format(
      'create trigger log_activity after insert or update or delete on public.%I for each row execute function public.log_activity()', t
    );
  end loop;
end $$;

-- Helpers called from Server Actions (security invoker: RLS still applies) ------------------------

-- Replace a project's or a job's technology tags with `names`, creating unknown technologies.
create or replace function public.set_technologies(owner_kind text, owner_id uuid, names text[])
returns void language plpgsql set search_path = '' as $$
declare
  clean text[];
begin
  select coalesce(array_agg(n order by ord), '{}') into clean
  from (
    select distinct on (lower(btrim(n))) btrim(n) as n, ord
    from unnest(names) with ordinality as u(n, ord)
    where btrim(n) <> ''
    order by lower(btrim(n)), ord
  ) s;

  insert into public.technologies (name)
  select n from unnest(clean) n
  on conflict ((lower(name))) do nothing;

  if owner_kind = 'project' then
    delete from public.project_technologies where project_id = owner_id;
    insert into public.project_technologies (project_id, technology_id, sort_order)
    select owner_id, t.id, u.ord
    from unnest(clean) with ordinality as u(n, ord)
    join public.technologies t on lower(t.name) = lower(u.n);
  elsif owner_kind = 'experience' then
    delete from public.experience_technologies where experience_id = owner_id;
    insert into public.experience_technologies (experience_id, technology_id, sort_order)
    select owner_id, t.id, u.ord
    from unnest(clean) with ordinality as u(n, ord)
    join public.technologies t on lower(t.name) = lower(u.n);
  else
    raise exception 'unknown owner kind %', owner_kind;
  end if;
end $$;

-- Set sort_order from the position of each id in `ids`.
create or replace function public.reorder(table_name text, ids uuid[])
returns void language plpgsql set search_path = '' as $$
begin
  if table_name not in (
    'social_links', 'skill_categories', 'skills', 'focus_areas', 'projects', 'project_images',
    'education', 'experiences', 'accomplishments', 'featured_repos', 'documents'
  ) then
    raise exception 'table % cannot be reordered', table_name;
  end if;

  execute format(
    'update public.%I as t set sort_order = x.ord from unnest($1) with ordinality as x(id, ord) where t.id = x.id',
    table_name
  ) using ids;
end $$;
