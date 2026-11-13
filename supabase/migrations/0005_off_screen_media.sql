-- Off-screen page media: an audio track for the record player, and image sets for the film strip
-- and the anime section. Audio is added to the public bucket's allowed content types.

alter table public.site_settings
  add column os_track_path   text,
  add column os_film_images  text[] not null default '{}',
  add column os_anime_images text[] not null default '{}';

update storage.buckets
set allowed_mime_types = array[
  'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml', 'image/x-icon',
  'image/vnd.microsoft.icon', 'application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'
]
where id = 'public-assets';
