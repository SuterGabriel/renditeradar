-- Tabelle objekte: ein Renditeobjekt pro Zeile.
-- Kennzahlen werden in der Pipeline berechnet und hier gespeichert, damit
-- nach Rendite gefiltert und sortiert werden kann, ohne alle Zeilen zu laden.
-- Siehe docs/entscheide/003-kennzahlen-in-der-datenbank.md.

create table public.objekte (
  -- Fortlaufende Ganzzahl statt zufälliger UUID: bessere Indexlokalität,
  -- und die öffentliche Kennung ist ohnehin der slug.
  id bigint generated always as identity primary key,

  -- Hash aus PLZ, Strasse und Fläche. Zwei Inserate mit gleichem Hash sind
  -- dasselbe Objekt, die Pipeline macht darauf einen Upsert.
  dedup_hash text not null unique,

  titel text not null,
  slug text not null unique,
  typ text not null check (typ in ('Wohnung', 'Haus', 'Mehrfamilienhaus')),

  plz text not null check (plz ~ '^[1-9][0-9]{3}$'),
  ort text not null,
  kanton text not null check (kanton ~ '^[A-Z]{2}$'),
  strasse text not null,

  flaeche_m2 numeric(7, 1) not null check (flaeche_m2 > 0),
  zimmer numeric(3, 1) not null check (zimmer > 0),
  preis_chf integer not null check (preis_chf > 0),
  mietertrag_jahr_chf integer not null check (mietertrag_jahr_chf >= 0),
  nebenkosten_quote numeric(4, 3) not null default 0.25
    check (nebenkosten_quote >= 0 and nebenkosten_quote < 1),

  -- Berechnete Kennzahlen, Formeln in pipeline/kennzahlen.py
  bruttorendite numeric(6, 4) not null,
  nettorendite numeric(6, 4) not null,
  preis_pro_m2 numeric(10, 2) not null,
  preis_pro_zimmer numeric(12, 2) not null,

  lat numeric(9, 6) not null check (lat between 45.8 and 47.9),
  lon numeric(9, 6) not null check (lon between 5.9 and 10.6),

  quelle text not null,
  erfasst_am timestamptz not null default now()
);

comment on table public.objekte is
  'Renditeobjekte mit berechneten Kennzahlen. Daten generiert, kein reales Inserat.';

-- Listenfilter: Kanton und Typ als Gleichheit, Preis als Bereich.
-- Reihenfolge Gleichheit vor Bereich, damit der Index für alle Kombinationen greift.
create index objekte_kanton_typ_preis_idx
  on public.objekte (kanton, typ, preis_chf);

-- Standardsortierung der Liste: höchste Bruttorendite zuerst.
create index objekte_bruttorendite_idx
  on public.objekte (bruttorendite desc);

-- Öffentliche Seite liest mit dem Anon-Key. RLS mit reiner Leseberechtigung,
-- keine Policy für insert, update oder delete. Die Pipeline schreibt über
-- eine direkte Postgres-Verbindung als Tabellenbesitzer und umgeht RLS.
alter table public.objekte enable row level security;

create policy objekte_oeffentlich_lesen
  on public.objekte
  for select
  to anon, authenticated
  using (true);
