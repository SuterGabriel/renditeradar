-- M5: Standortsuche mit PostGIS.
-- Ergänzt die Tabelle objekte um eine Geography-Spalte, einen GiST-Index,
-- eine Sicht über die Orte und zwei Funktionen für Umkreissuche und
-- Vergleichsobjekte. Begründung in docs/entscheide/004-postgis-statt-bounding-box.md.

create extension if not exists postgis with schema extensions;

-- Erzeugte Spalte statt einer gepflegten: sie kann nicht von lat und lon
-- abweichen, weil die Datenbank sie bei jedem Schreiben selbst ableitet.
-- Die Pipeline muss nichts davon wissen.
-- Reihenfolge in ST_MakePoint ist Länge vor Breite, nicht umgekehrt.
alter table public.objekte
  add column if not exists geog geography(Point, 4326)
  generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(lon::double precision, lat::double precision), 4326)::geography
  ) stored;

comment on column public.objekte.geog is
  'Lage als Geography, aus lat und lon abgeleitet. Rechnet in Metern auf dem Ellipsoid.';

-- GiST-Index für ST_DWithin und für die Suche nach dem nächsten Nachbarn.
-- Ohne ihn liest jede Umkreisabfrage die ganze Tabelle.
create index if not exists objekte_geog_idx on public.objekte using gist (geog);

-- Orte mit einer Koordinate je Ort, für die Auswahl im Umkreisfilter.
-- Aus den Daten abgeleitet, damit kein Ort angeboten wird, der keine Objekte hat.
create or replace view public.orte
with (security_invoker = true) as
select
  ort,
  kanton,
  count(*)::integer as anzahl,
  round(avg(lat), 6) as lat,
  round(avg(lon), 6) as lon
from public.objekte
group by ort, kanton;

comment on view public.orte is
  'Orte mit Objektzahl und mittlerer Koordinate, für den Umkreisfilter.';

-- Objekte im Umkreis eines Punktes.
-- Gibt setof objekte zurück, damit die Anwendung darauf weiter filtern und
-- sortieren kann, statt die Filter ein zweites Mal in SQL abzubilden.
-- ST_DWithin statt ST_Distance im where, weil nur ST_DWithin den Index nutzt.
create or replace function public.objekte_im_umkreis(
  p_lat numeric,
  p_lon numeric,
  p_radius_m integer
)
returns setof public.objekte
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select *
  from public.objekte
  where ST_DWithin(
    geog,
    ST_SetSRID(ST_MakePoint(p_lon::double precision, p_lat::double precision), 4326)::geography,
    p_radius_m
  );
$$;

comment on function public.objekte_im_umkreis is
  'Objekte innerhalb von p_radius_m Metern um einen Punkt. Nutzt den GiST-Index über ST_DWithin.';

-- Die nächstgelegenen Vergleichsobjekte zu einem Objekt, mit Distanz.
--
-- Der Bezugspunkt steht als skalare Unterabfrage da und nicht als Join. Nur so
-- wird er für den Planer zu einer Konstante, und erst dann kann der GiST-Index
-- die Suche nach dem nächsten Nachbarn über den Operator <-> bedienen. Mit
-- einem Join daraus wird ein Seq Scan mit anschliessendem Sortieren, was bei
-- 400 Zeilen noch schnell ist und bei 400'000 nicht mehr.
create or replace function public.vergleichsobjekte(
  p_slug text,
  p_anzahl integer default 5
)
returns table (
  slug text,
  titel text,
  ort text,
  distanz_m double precision,
  preis_chf integer,
  preis_pro_m2 numeric,
  bruttorendite numeric
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    o.slug,
    o.titel,
    o.ort,
    ST_Distance(o.geog, (select z.geog from public.objekte z where z.slug = p_slug)) as distanz_m,
    o.preis_chf,
    o.preis_pro_m2,
    o.bruttorendite
  from public.objekte o
  where o.slug <> p_slug
    -- Ohne diese Bedingung liefert ein unbekannter Slug beliebige Zeilen mit
    -- leerer Distanz, weil die Unterabfrage dann nichts ergibt und die
    -- Sortierung nichts zu vergleichen hat.
    and (select z.geog from public.objekte z where z.slug = p_slug) is not null
  order by o.geog <-> (select z.geog from public.objekte z where z.slug = p_slug)
  limit greatest(p_anzahl, 0);
$$;

comment on function public.vergleichsobjekte is
  'Die p_anzahl nächstgelegenen Objekte zu einem Slug, mit Distanz in Metern. Nutzt den GiST-Index über den Operator <->.';
