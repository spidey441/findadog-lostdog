create extension if not exists pgcrypto;

create table if not exists dogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_months int not null,
  type text not null check (type in ('small', 'medium', 'large', 'senior')),
  status text not null default 'available' check (status in ('available', 'adopted')),
  breed text,
  temperament_tags text[] default '{}',
  bio text,
  image_url text,
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  party_size int not null,
  walk_mode text not null,
  interests text[] not null,
  dog_interest text,
  note text,
  created_at timestamptz default now()
);

alter table dogs add column if not exists breed text;
alter table dogs add column if not exists temperament_tags text[] default '{}';
alter table rsvps add column if not exists dog_interest text;

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  caption text not null,
  image_url text not null,
  created_at timestamptz default now()
);

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  spot text not null,
  level text not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  captain_email text not null,
  goal text not null,
  created_at timestamptz default now()
);

alter table dogs enable row level security;
alter table rsvps enable row level security;
alter table gallery_photos enable row level security;
alter table sponsors enable row level security;
alter table teams enable row level security;

drop policy if exists "Public can view dogs" on dogs;
drop policy if exists "Public can view gallery" on gallery_photos;
drop policy if exists "Public can submit rsvps" on rsvps;
drop policy if exists "Public can submit sponsor requests" on sponsors;
drop policy if exists "Public can submit teams" on teams;
drop policy if exists "Admins can manage dogs" on dogs;
drop policy if exists "Admins can view rsvps" on rsvps;
drop policy if exists "Admins can view sponsors" on sponsors;
drop policy if exists "Admins can view teams" on teams;
drop policy if exists "Admins can manage gallery" on gallery_photos;

create policy "Public can view dogs"
on dogs for select using (true);

create policy "Public can view gallery"
on gallery_photos for select using (true);

create policy "Public can submit rsvps"
on rsvps for insert with check (true);

create policy "Public can submit sponsor requests"
on sponsors for insert with check (true);

create policy "Public can submit teams"
on teams for insert with check (true);

create policy "Admins can manage dogs"
on dogs for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Admins can view rsvps"
on rsvps for select
using (auth.role() = 'authenticated');

create policy "Admins can view sponsors"
on sponsors for select
using (auth.role() = 'authenticated');

create policy "Admins can view teams"
on teams for select
using (auth.role() = 'authenticated');

create policy "Admins can manage gallery"
on gallery_photos for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create or replace function fdld_public_stats()
returns table(total_rsvps bigint, adoption_interests bigint, volunteer_interests bigint)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::bigint as total_rsvps,
    count(*) filter (where interests @> array['adopt']::text[])::bigint as adoption_interests,
    count(*) filter (where interests @> array['volunteer']::text[])::bigint as volunteer_interests
  from rsvps;
$$;

grant execute on function fdld_public_stats() to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('fdld-gallery', 'fdld-gallery', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view gallery images" on storage.objects;
drop policy if exists "Admins can upload gallery images" on storage.objects;
drop policy if exists "Admins can update gallery images" on storage.objects;
drop policy if exists "Admins can delete gallery images" on storage.objects;

create policy "Public can view gallery images"
on storage.objects for select
using (bucket_id = 'fdld-gallery');

create policy "Admins can upload gallery images"
on storage.objects for insert
with check (bucket_id = 'fdld-gallery' and auth.role() = 'authenticated');

create policy "Admins can update gallery images"
on storage.objects for update
using (bucket_id = 'fdld-gallery' and auth.role() = 'authenticated')
with check (bucket_id = 'fdld-gallery' and auth.role() = 'authenticated');

create policy "Admins can delete gallery images"
on storage.objects for delete
using (bucket_id = 'fdld-gallery' and auth.role() = 'authenticated');

insert into dogs (name, age_months, type, status, breed, temperament_tags, bio, image_url, featured)
values
  ('Sunny', 24, 'medium', 'available', 'Australian cattle dog mix', array['easy leash','people-curious','patient home'], 'Easy on leash, people-curious, and happiest with a patient walking partner.', 'assets/rescue-portrait.png', true),
  ('Maple', 48, 'large', 'available', 'Shepherd mix', array['calm','loyal','quiet mornings'], 'Soft-eyed and steady, Maple is ready for quiet mornings and loyal routines.', 'assets/adoption-meet.png', true),
  ('Rio', 12, 'medium', 'available', 'Retriever mix', array['bouncy','treat-motivated','quick learner'], 'Bright, bouncy, and treat-motivated, Rio is learning how good home can feel.', 'assets/family-walk.png', true),
  ('Poppy', 8, 'small', 'available', 'Terrier mix', array['lap naps','friendly','short walks'], 'A compact little shadow who loves greetings, short walks, and lap naps.', 'assets/rescue-portrait.png', false),
  ('Cedar', 84, 'senior', 'available', 'Lab mix', array['mellow','great manners','slow strolls'], 'A mellow senior with excellent manners and a soft spot for slow trail strolls.', 'assets/adoption-meet.png', false),
  ('Juniper', 36, 'large', 'adopted', 'Husky mix', array['adopted','trail buddy','weekend hiker'], 'Juniper found a family through an FDLD meet-and-greet and now hikes every weekend.', 'assets/family-walk.png', false),
  ('Scout', 18, 'small', 'adopted', 'Chihuahua mix', array['adopted','bright','small home'], 'Scout''s adoption story is a reminder that the right walk can start a new life.', 'assets/rescue-portrait.png', false),
  ('Saguaro', 60, 'large', 'available', 'Boxer mix', array['steady','confident handler','outdoorsy'], 'Steady, loyal, and happiest beside confident handlers who love the outdoors.', 'assets/adoption-meet.png', false)
on conflict do nothing;
