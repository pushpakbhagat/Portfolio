-- Paper design options that used to live in code: the colour palette, switches for the compass,
-- the project switchboard and the off-screen page, and the off-screen page's content.
-- Lists of "label: text" pairs are stored as plain strings and split on the first colon.

alter table public.site_settings
  add column paper_palette          text    not null default 'plum' check (paper_palette in ('plum', 'blueprint', 'marigold', 'forest')),
  add column paper_show_compass     boolean not null default true,
  add column paper_show_switchboard boolean not null default true,
  add column paper_show_off_screen  boolean not null default true,
  add column os_intro               text    not null default 'I love building applications. Away from the keyboard it''s movies, anime, music and PC games.',
  add column os_track_title         text    not null default '',
  add column os_track_artist        text    not null default '',
  add column os_playlists           text[]  not null default '{}',
  add column os_films               text[]  not null default '{}',
  add column os_anime               text[]  not null default '{}',
  add column os_shouts              text[]  not null default '{"SHIPPED IT!","ONE MORE BUG!","PLOT TWIST!","IT COMPILES!"}',
  add column os_games               text[]  not null default '{"GTA: open-world chaos","Red Dead: long rides west","NFS: pedal down"}';
