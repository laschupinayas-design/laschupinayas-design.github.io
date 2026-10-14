-- Esquema de eventos y reservas ("Apartar evento")
-- Supabase: SQL Editor > New query > pega todo > Run

-- ---------------------------------------------------------------------
-- SOLO si ya ejecutaste una versión anterior de este archivo, quita los
-- "--" de estas 3 líneas y ejecútalas primero. BORRA los datos de prueba.
-- ---------------------------------------------------------------------
-- drop view if exists public.event_availability;
-- drop table if exists public.reservations;
-- drop table if exists public.events;

-- =====================================================================
-- 1. Eventos
-- =====================================================================
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- va en la dirección: /#/eventos/<slug>
  tipo          text not null check (tipo in ('tour', 'gratuito')),
  title         text not null,
  description   text,
  starts_at     timestamptz not null,
  meeting_point text,
  level         text check (level is null or level in ('principiante', 'intermedio', 'avanzado')),
  distance_km   numeric(5, 1) check (distance_km is null or distance_km >= 0),
  elevation_m   integer check (elevation_m is null or elevation_m >= 0),
  image_url     text,
  capacity      integer not null check (capacity > 0),
  price_mxn     numeric(10, 2) not null default 0 check (price_mxn >= 0),
  is_published  boolean not null default true,
  check (tipo <> 'gratuito' or price_mxn = 0)
);

-- =====================================================================
-- 2. Reservas (lo que llena la persona en la ventana "Apartar evento")
-- =====================================================================
create table if not exists public.reservations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  event_id      uuid not null references public.events (id),

  spots         integer not null default 1 check (spots between 1 and 10),

  -- Datos personales
  full_name     text not null check (char_length(full_name) between 2 and 100),
  email         text not null check (
                  char_length(email) <= 150
                  and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
                ),
  phone_country text not null default '+52' check (phone_country ~ '^\+[0-9]{1,3}$'),
  phone         text not null check (phone ~ '^[0-9]{7,15}$'),
  birth_date    date not null check (birth_date >= date '1900-01-01'),
  medical_notes text check (medical_notes is null or char_length(medical_notes) <= 1000),

  -- Contacto de emergencia
  emergency_name          text not null check (char_length(emergency_name) between 2 and 100),
  emergency_relationship  text not null check (char_length(emergency_relationship) between 2 and 50),
  emergency_phone_country text not null default '+52' check (emergency_phone_country ~ '^\+[0-9]{1,3}$'),
  emergency_phone         text not null check (emergency_phone ~ '^[0-9]{7,15}$'),

  -- Carta de responsabilidad compartida
  waiver_accepted    boolean not null check (waiver_accepted),
  waiver_accepted_at timestamptz not null default now(),

  -- Seguimiento del pago por transferencia
  status      text not null default 'pendiente'
              check (status in ('pendiente', 'pagada', 'confirmada', 'cancelada')),
  payment_ref text
);

-- Un correo, una reserva activa por evento.
create unique index if not exists reservations_one_active_per_email
  on public.reservations (event_id, lower(email))
  where status <> 'cancelada';

create index if not exists reservations_event_idx on public.reservations (event_id);

-- =====================================================================
-- 3. Control de cupo
-- =====================================================================
create or replace function public.check_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap   integer;
  taken integer;
begin
  select capacity into cap
    from public.events
   where id = new.event_id and is_published
   for update;

  if cap is null then
    raise exception 'El evento no está disponible';
  end if;

  select coalesce(sum(spots), 0) into taken
    from public.reservations
   where event_id = new.event_id and status <> 'cancelada';

  if taken + new.spots > cap then
    raise exception 'No hay lugares suficientes. Disponibles: %', greatest(cap - taken, 0);
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_check_capacity on public.reservations;
create trigger reservations_check_capacity
  before insert on public.reservations
  for each row execute function public.check_event_capacity();

-- =====================================================================
-- 4. Vista pública: eventos con lugares disponibles (sin exponer reservas)
-- =====================================================================
create or replace view public.event_availability as
select
  e.id, e.slug, e.tipo, e.title, e.description, e.starts_at, e.meeting_point,
  e.level, e.distance_km, e.elevation_m, e.image_url, e.price_mxn, e.capacity,
  (e.capacity - coalesce(sum(r.spots) filter (where r.status <> 'cancelada'), 0))::integer as spots_left
from public.events e
left join public.reservations r on r.event_id = e.id
where e.is_published
group by e.id;

grant select on public.event_availability to anon;

-- =====================================================================
-- 5. Seguridad (Row Level Security)
-- =====================================================================
alter table public.events       enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
  on public.events for select to anon
  using (is_published);

-- El público solo puede CREAR reservas en estado "pendiente".
-- Nadie puede leer, cambiar ni borrar reservas desde el navegador;
-- tú las ves y las cambias desde el panel de Supabase.
drop policy if exists "Public can create pending reservations" on public.reservations;
create policy "Public can create pending reservations"
  on public.reservations for insert to anon
  with check (status = 'pendiente' and payment_ref is null and waiver_accepted);

-- =====================================================================
-- 6. Eventos de ejemplo (quita los "--" de este bloque para cargarlos)
-- =====================================================================
-- insert into public.events (slug, tipo, title, description, starts_at, meeting_point, level, distance_km, elevation_m, capacity, price_mxn) values
--   ('mirador-del-cerro',      'tour',     'Mirador del cerro (ejemplo)',      'Descripción de ejemplo.', timestamptz '2026-10-25 07:30:00-06', 'Estacionamiento del parque', 'intermedio',  8,  350, 20, 350),
--   ('caminata-de-bienvenida', 'gratuito', 'Caminata de bienvenida (ejemplo)', 'Descripción de ejemplo.', timestamptz '2026-11-01 08:00:00-06', 'Entrada principal',          'principiante', 4,   60, 30,   0),
--   ('sendero-del-arroyo',     'tour',     'Sendero del arroyo (ejemplo)',     'Descripción de ejemplo.', timestamptz '2026-11-08 08:00:00-06', 'Entrada principal',          'principiante', 5,  120, 15, 250);
