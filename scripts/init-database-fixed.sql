-- Créer les tables pour l'application Flair
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  prenom text,
  email text unique,
  genre text,
  orientation text,
  age int,
  ville text,
  bio text,
  photo_url text,
  tags text[],
  latitude float8,
  longitude float8,
  is_admin boolean default false,
  is_visible boolean default true,
  created_at timestamp default now()
);

create table if not exists likes (
  user_id uuid references users(id) on delete cascade,
  liked_user_id uuid references users(id) on delete cascade,
  created_at timestamp default now(),
  primary key (user_id, liked_user_id)
);

create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  user1_id uuid references users(id) on delete cascade,
  user2_id uuid references users(id) on delete cascade,
  created_at timestamp default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  texte text,
  timestamp timestamp default now()
);

create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  reported_user_id uuid references users(id) on delete cascade,
  raison text,
  created_at timestamp default now()
);

create table if not exists blocks (
  blocker_id uuid references users(id) on delete cascade,
  blocked_id uuid references users(id) on delete cascade,
  created_at timestamp default now(),
  primary key (blocker_id, blocked_id)
);

-- Activer RLS (Row Level Security)
alter table users enable row level security;
alter table likes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;

-- Politiques RLS pour les utilisateurs
create policy "Les utilisateurs peuvent voir les profils visibles" on users
  for select using (is_visible = true);

create policy "Les utilisateurs peuvent modifier leur propre profil" on users
  for update using (auth.uid() = id);

create policy "Les utilisateurs peuvent insérer leur profil" on users
  for insert with check (auth.uid() = id);

-- Politiques pour les likes
create policy "Les utilisateurs peuvent voir leurs likes" on likes
  for select using (auth.uid() = user_id);

create policy "Les utilisateurs peuvent liker" on likes
  for insert with check (auth.uid() = user_id);

-- Politiques pour les matches
create policy "Les utilisateurs peuvent voir leurs matches" on matches
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Système peut créer des matches" on matches
  for insert with check (true);

-- Politiques pour les messages
create policy "Les utilisateurs peuvent voir les messages de leurs matches" on messages
  for select using (
    exists (
      select 1 from matches 
      where id = match_id 
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

create policy "Les utilisateurs peuvent envoyer des messages dans leurs matches" on messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from matches 
      where id = match_id 
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

-- Politiques pour les signalements
create policy "Les utilisateurs peuvent signaler" on reports
  for insert with check (auth.uid() = user_id);

create policy "Les admins peuvent voir tous les signalements" on reports
  for select using (
    exists (select 1 from users where id = auth.uid() and is_admin = true)
  );

-- Politiques pour les blocages
create policy "Les utilisateurs peuvent bloquer" on blocks
  for insert with check (auth.uid() = blocker_id);

create policy "Les utilisateurs peuvent voir leurs blocages" on blocks
  for select using (auth.uid() = blocker_id);

-- Fonction pour créer automatiquement le profil utilisateur après inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger pour créer le profil automatiquement
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fonction pour calculer la distance entre deux points (formule de Haversine)
create or replace function calculate_distance(
  lat1 float8, lon1 float8, lat2 float8, lon2 float8
) returns float8 as $$
declare
  r float8 := 6371; -- Rayon de la Terre en km
  dlat float8;
  dlon float8;
  a float8;
  c float8;
begin
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  return r * c;
end;
$$ language plpgsql immutable;

-- Index pour améliorer les performances (sans ll_to_earth)
create index if not exists users_visible_idx on users (is_visible);
create index if not exists users_location_idx on users (latitude, longitude);
create index if not exists likes_user_idx on likes (user_id);
create index if not exists matches_users_idx on matches (user1_id, user2_id);
create index if not exists messages_match_idx on messages (match_id);
create index if not exists messages_timestamp_idx on messages (timestamp);
