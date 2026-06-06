-- Botanikum Stammblatt – Tabellen (Prefix stammblatt_ damit Gärtnerei-App unberührt bleibt)
-- In Supabase: SQL Editor → New query → einfügen → Run

-- ── Tabellen ──────────────────────────────────────────────────

create table if not exists stammblatt_kunden (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  firma text,
  vorname text,
  plz text,
  ort text,
  strasse text,
  telefon text,
  email text,
  code text,
  jahr text,
  rabatt_xf numeric default 1,
  restbetrag text,
  zugesagt boolean default false,
  abholung text,
  umtopfarbeiten text,
  osteria text,
  vapiano text,
  total_aktuell text,
  total_vorjahr text,
  alte_cm text,
  kdr text,
  neukunde boolean default false,
  auslieferung_abholung text,
  ausgeliefert_am text,
  ersatzpflanzen text,
  ortsteil text,
  lieferadresse text,
  mail text,
  bemerkungen_aktuell text,
  bemerkungen_2022 text,
  bemerkungen_2023 text,
  bemerkungen_2024 text,
  bemerkungen_2025 text,
  restpflanzen text,
  restpflanzen_info text,
  trans_txt text,
  trans_preis numeric default 0,
  duenger_txt text,
  duenger_preis numeric default 0,
  zeit_abholung text,
  rabatt_txt text,
  gutschein text,
  transportdauer text,
  camelia text,
  vapiano_pflanzen text
);

create table if not exists stammblatt_positionen (
  id uuid primary key default gen_random_uuid(),
  kunde_id uuid references stammblatt_kunden(id) on delete cascade,
  label text not null,
  sort_order int default 0,
  art text,
  anzahl text,
  cm numeric,
  preis numeric
);

create table if not exists stammblatt_touren (
  id uuid primary key default gen_random_uuid(),
  name text,
  fahrer text,
  datum date,
  farbe text default '#10b981'
);

create table if not exists stammblatt_tour_kunden (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid references stammblatt_touren(id) on delete cascade,
  kunde_id uuid references stammblatt_kunden(id) on delete cascade,
  sort_order int default 0,
  unique (tour_id, kunde_id)
);

create table if not exists stammblatt_formular_felder (
  id uuid primary key default gen_random_uuid(),
  field_id text,
  label text,
  type text default 'text',
  prefix text,
  suffix text,
  formula text,
  options text,
  sort_order int default 0
);

create table if not exists stammblatt_kunden_felder (
  id uuid primary key default gen_random_uuid(),
  kunde_id uuid references stammblatt_kunden(id) on delete cascade,
  feld_id text not null,
  wert text,
  unique (kunde_id, feld_id)
);

-- ── Row Level Security ────────────────────────────────────────

alter table stammblatt_kunden enable row level security;
alter table stammblatt_positionen enable row level security;
alter table stammblatt_touren enable row level security;
alter table stammblatt_tour_kunden enable row level security;
alter table stammblatt_formular_felder enable row level security;
alter table stammblatt_kunden_felder enable row level security;

-- Nur eingeloggte Nutzer (gleiche Auth wie Gärtnerei-App)
create policy "auth read stammblatt_kunden" on stammblatt_kunden for select to authenticated using (true);
create policy "auth insert stammblatt_kunden" on stammblatt_kunden for insert to authenticated with check (true);
create policy "auth update stammblatt_kunden" on stammblatt_kunden for update to authenticated using (true);
create policy "auth delete stammblatt_kunden" on stammblatt_kunden for delete to authenticated using (true);

create policy "auth read stammblatt_positionen" on stammblatt_positionen for select to authenticated using (true);
create policy "auth insert stammblatt_positionen" on stammblatt_positionen for insert to authenticated with check (true);
create policy "auth update stammblatt_positionen" on stammblatt_positionen for update to authenticated using (true);
create policy "auth delete stammblatt_positionen" on stammblatt_positionen for delete to authenticated using (true);

create policy "auth read stammblatt_touren" on stammblatt_touren for select to authenticated using (true);
create policy "auth insert stammblatt_touren" on stammblatt_touren for insert to authenticated with check (true);
create policy "auth update stammblatt_touren" on stammblatt_touren for update to authenticated using (true);
create policy "auth delete stammblatt_touren" on stammblatt_touren for delete to authenticated using (true);

create policy "auth read stammblatt_tour_kunden" on stammblatt_tour_kunden for select to authenticated using (true);
create policy "auth insert stammblatt_tour_kunden" on stammblatt_tour_kunden for insert to authenticated with check (true);
create policy "auth update stammblatt_tour_kunden" on stammblatt_tour_kunden for update to authenticated using (true);
create policy "auth delete stammblatt_tour_kunden" on stammblatt_tour_kunden for delete to authenticated using (true);

create policy "auth read stammblatt_formular_felder" on stammblatt_formular_felder for select to authenticated using (true);
create policy "auth insert stammblatt_formular_felder" on stammblatt_formular_felder for insert to authenticated with check (true);
create policy "auth update stammblatt_formular_felder" on stammblatt_formular_felder for update to authenticated using (true);
create policy "auth delete stammblatt_formular_felder" on stammblatt_formular_felder for delete to authenticated using (true);

create policy "auth read stammblatt_kunden_felder" on stammblatt_kunden_felder for select to authenticated using (true);
create policy "auth insert stammblatt_kunden_felder" on stammblatt_kunden_felder for insert to authenticated with check (true);
create policy "auth update stammblatt_kunden_felder" on stammblatt_kunden_felder for update to authenticated using (true);
create policy "auth delete stammblatt_kunden_felder" on stammblatt_kunden_felder for delete to authenticated using (true);
