-- A second look for the public site ("paper": hand-drawn sheets on a dark desk), chosen in
-- Admin → Settings, plus the content only that design shows. The existing design is "studio".
-- The public read policy on site_settings already covers the new columns.

alter table public.site_settings
  add column design             text   not null default 'studio' check (design in ('studio', 'paper')),
  add column paper_headline     text   not null default 'Apps that feel',
  add column paper_swap_words   text[] not null default '{fast,simple,alive}',
  add column paper_beliefs      text[] not null default '{}',
  add column paper_looking_for  text[] not null default '{}',
  add column paper_meme_path    text,
  add column paper_meme_caption text   not null default '';
