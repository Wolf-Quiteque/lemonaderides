-- ============================================================================
-- Complete Ride Sharing Platform Database Schema
-- ============================================================================

-- Enable useful extensions
create extension if not exists "uuid-ossp";
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ============================================================================
-- BASE TABLES (Must be created first)
-- ============================================================================

-- Users table (referenced by all other tables)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text not null,
  role varchar(20) not null default 'employee' check (role in ('employee','driver','supervisor','admin')),
  phone text,
  company_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  message text,
  type varchar(50),
  related_entity_type varchar(50),
  related_entity_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- RIDES CORE TABLES
-- ============================================================================

-- Rides table (core request)
create table if not exists public.rides (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.users(id) on delete cascade,
  company_id text null, -- optional for multi-company
  origin text not null,
  origin_coords geography(point, 4326) null, -- lon/lat
  destination text not null,
  destination_coords geography(point, 4326) null, -- lon/lat
  scheduled_for timestamptz null,
  seats_requested int not null default 1 check (seats_requested > 0),
  notes text null,
  status varchar(20) not null default 'pending' check (status in ('pending','approved','rejected','open','claimed','assigned','in_progress','completed','canceled')),
  rejection_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Approvals table (supervisor approvals)
create table if not exists public.approvals (
  id uuid primary key default uuid_generate_v4(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  status varchar(20) not null check (status in ('approved','rejected')),
  notes text,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Claims (driver claims a visible/approved ride)
create table if not exists public.ride_claims (
  id uuid primary key default uuid_generate_v4(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  driver_id uuid not null references public.users(id) on delete cascade,
  status varchar(20) not null default 'claimed' check (status in ('claimed','accepted','declined','withdrawn','expired')),
  created_at timestamptz not null default now(),
  unique (ride_id, driver_id)
);

-- Winner assignment (which claim actually got the ride)
create table if not exists public.ride_assignments (
  id uuid primary key default uuid_generate_v4(),
  ride_id uuid not null unique references public.rides(id) on delete cascade,
  driver_id uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now()
);

-- ============================================================================
-- POOLING TABLES
-- ============================================================================

-- Ride pools (carpooling groups)
create table if not exists public.ride_pools (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references public.users(id) on delete cascade,
  route_polyline text null, -- optional for mapping
  origin_coords geography(point, 4326),
  destination_coords geography(point, 4326),
  departure_time timestamptz not null,
  status varchar(20) not null default 'active' check (status in ('active','in_progress','completed','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pool participants (riders in a pool)
create table if not exists public.pool_participants (
  id uuid primary key default uuid_generate_v4(),
  pool_id uuid not null references public.ride_pools(id) on delete cascade,
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  pickup_location text,
  pickup_coords geography(point, 4326),
  dropoff_location text,
  dropoff_coords geography(point, 4326),
  status varchar(20) not null default 'confirmed' check (status in ('confirmed','picked_up','dropped_off','canceled')),
  joined_at timestamptz not null default now(),
  unique (pool_id, ride_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
create index if not exists users_email_idx on public.users(email);
create index if not exists users_role_idx on public.users(role);

-- Rides indexes
create index if not exists rides_requester_idx on public.rides(requester_id);
create index if not exists rides_status_idx on public.rides(status);
create index if not exists rides_scheduled_idx on public.rides(scheduled_for);
create index if not exists rides_origin_gix on public.rides using gist (origin_coords);
create index if not exists rides_destination_gix on public.rides using gist (destination_coords);

-- Approvals indexes
create index if not exists approvals_ride_idx on public.approvals(ride_id);
create index if not exists approvals_created_by_idx on public.approvals(created_by);
create index if not exists approvals_created_at_idx on public.approvals(created_at desc);

-- Claims indexes
create index if not exists ride_claims_ride_idx on public.ride_claims(ride_id);
create index if not exists ride_claims_driver_idx on public.ride_claims(driver_id);
create index if not exists ride_claims_status_idx on public.ride_claims(status);

-- Assignments indexes
create index if not exists ride_assignments_driver_idx on public.ride_assignments(driver_id);

-- Pools indexes
create index if not exists ride_pools_driver_idx on public.ride_pools(driver_id);
create index if not exists ride_pools_status_idx on public.ride_pools(status);
create index if not exists ride_pools_departure_idx on public.ride_pools(departure_time);
create index if not exists ride_pools_origin_gix on public.ride_pools using gist (origin_coords);
create index if not exists ride_pools_destination_gix on public.ride_pools using gist (destination_coords);

-- Pool participants indexes
create index if not exists pool_participants_pool_idx on public.pool_participants(pool_id);
create index if not exists pool_participants_ride_idx on public.pool_participants(ride_id);
create index if not exists pool_participants_user_idx on public.pool_participants(user_id);

-- Notifications indexes
create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Suggested pooling candidates materialized view (fast lookup)
create materialized view if not exists public.pool_suggestions as
select
  r.id as ride_id,
  r.requester_id,
  r.origin_coords,
  r.destination_coords,
  r.scheduled_for
from public.rides r
where r.status in ('approved','open');

-- Indexes for materialized view
create index if not exists pool_suggestions_origin_gix on public.pool_suggestions using gist (origin_coords);
create index if not exists pool_suggestions_destination_gix on public.pool_suggestions using gist (destination_coords);
create index if not exists pool_suggestions_scheduled_idx on public.pool_suggestions(scheduled_for);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Helpers to read JWT claims
create or replace function public.current_user_id() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub',
    ''
  )::uuid;
$$;

create or replace function public.current_user_role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role',
    'employee'
  );
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Notify ride status changes
create or replace function public.tg_notify_ride_status()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'UPDATE' and new.status <> old.status) then
    insert into public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    values (
      new.requester_id,
      'Ride ' || new.status,
      'Your ride request is now ' || new.status ||
        case 
          when new.status='rejected' and new.rejection_reason is not null 
          then ' – Reason: ' || new.rejection_reason 
          else '' 
        end,
      'ride_status',
      'ride',
      new.id
    );
  end if;
  return new;
end $$;

drop trigger if exists tr_ride_status_notify on public.rides;
create trigger tr_ride_status_notify
after update on public.rides
for each row execute function public.tg_notify_ride_status();

-- Trigger: Auto-open ride after approval
create or replace function public.tg_open_ride_after_approval()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' then
    update public.rides 
    set status = 'open', updated_at = now() 
    where id = new.ride_id;
  elsif new.status = 'rejected' then
    update public.rides 
    set status = 'rejected', 
        rejection_reason = coalesce(new.notes, 'Rejected'), 
        updated_at = now() 
    where id = new.ride_id;
  end if;
  return new;
end $$;

drop trigger if exists tr_approval_to_ride on public.approvals;
create trigger tr_approval_to_ride
after insert or update on public.approvals
for each row execute function public.tg_open_ride_after_approval();

-- Trigger: Update updated_at timestamp
create or replace function public.tg_update_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tr_rides_updated_at on public.rides;
create trigger tr_rides_updated_at
before update on public.rides
for each row execute function public.tg_update_timestamp();

drop trigger if exists tr_users_updated_at on public.users;
create trigger tr_users_updated_at
before update on public.users
for each row execute function public.tg_update_timestamp();

drop trigger if exists tr_ride_pools_updated_at on public.ride_pools;
create trigger tr_ride_pools_updated_at
before update on public.ride_pools
for each row execute function public.tg_update_timestamp();

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- RPC: Suggest pool candidates given a route corridor
create or replace function public.suggest_pool_candidates(
  p_origin geography(point, 4326),
  p_destination geography(point, 4326),
  p_departure timestamptz,
  p_radius_m int default 800,
  p_time_window_min int default 30
) returns table (
  ride_id uuid,
  requester_id uuid,
  origin_distance_m float8,
  destination_distance_m float8,
  scheduled_for timestamptz
) language sql stable as $$
  select
    r.id,
    r.requester_id,
    st_distance(r.origin_coords, p_origin) as origin_distance_m,
    st_distance(r.destination_coords, p_destination) as destination_distance_m,
    r.scheduled_for
  from public.rides r
  where r.status in ('approved', 'open')
    and r.scheduled_for between (p_departure - make_interval(mins => p_time_window_min))
                            and (p_departure + make_interval(mins => p_time_window_min))
    and st_dwithin(r.origin_coords, p_origin, p_radius_m)
    and st_dwithin(r.destination_coords, p_destination, p_radius_m)
  order by st_distance(r.origin_coords, p_origin) + st_distance(r.destination_coords, p_destination);
$$;

grant execute on function public.suggest_pool_candidates(geography, geography, timestamptz, int, int) to authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.rides enable row level security;
alter table public.ride_claims enable row level security;
alter table public.ride_assignments enable row level security;
alter table public.approvals enable row level security;
alter table public.ride_pools enable row level security;
alter table public.pool_participants enable row level security;
alter table public.notifications enable row level security;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

create policy "users can read own profile" on public.users
  for select to authenticated
  using (id = current_user_id() or current_user_role() in ('supervisor', 'admin'));

create policy "users can update own profile" on public.users
  for update to authenticated
  using (id = current_user_id())
  with check (id = current_user_id());

create policy "admins manage users" on public.users
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ============================================================================
-- RIDES POLICIES
-- ============================================================================

-- Riders can create their own rides
create policy "riders can create rides" on public.rides
  for insert to authenticated
  with check (requester_id = current_user_id());

-- Riders can read their own rides
create policy "riders can read own rides" on public.rides
  for select to authenticated
  using (requester_id = current_user_id());

-- Riders can update their own pending/rejected rides
create policy "riders can update own pending rides" on public.rides
  for update to authenticated
  using (requester_id = current_user_id() and status in ('pending', 'rejected'))
  with check (requester_id = current_user_id());

-- Supervisors/admins can read all rides
create policy "supervisors can read all rides" on public.rides
  for select to authenticated
  using (current_user_role() in ('supervisor', 'admin'));

-- Supervisors/admins can approve/reject rides
create policy "supervisors can approve reject" on public.rides
  for update to authenticated
  using (current_user_role() in ('supervisor', 'admin'))
  with check (current_user_role() in ('supervisor', 'admin'));

-- Drivers can read approved/open rides
create policy "drivers can read approved rides" on public.rides
  for select to authenticated
  using (
    current_user_role() in ('driver', 'admin') 
    and status in ('approved', 'open', 'claimed', 'assigned', 'in_progress', 'completed')
  );

-- ============================================================================
-- CLAIMS POLICIES
-- ============================================================================

-- Drivers can claim rides
create policy "drivers can claim rides" on public.ride_claims
  for insert to authenticated
  with check (current_user_role() in ('driver', 'admin') and driver_id = current_user_id());

-- Drivers can read their own claims
create policy "drivers read own claims" on public.ride_claims
  for select to authenticated
  using (driver_id = current_user_id() or current_user_role() in ('supervisor', 'admin'));

-- Drivers can update (withdraw) their own claims
create policy "drivers can withdraw claim" on public.ride_claims
  for update to authenticated
  using (driver_id = current_user_id())
  with check (driver_id = current_user_id());

-- Supervisors can manage all claims
create policy "supervisors manage claims" on public.ride_claims
  for all to authenticated
  using (current_user_role() in ('supervisor', 'admin'))
  with check (current_user_role() in ('supervisor', 'admin'));

-- ============================================================================
-- ASSIGNMENTS POLICIES
-- ============================================================================

-- Read assignments by relevant parties
create policy "read assignments by party" on public.ride_assignments
  for select to authenticated
  using (
    current_user_role() in ('supervisor', 'admin') or
    driver_id = current_user_id() or
    exists (
      select 1 from public.rides r 
      where r.id = ride_id and r.requester_id = current_user_id()
    )
  );

-- Only supervisors/admins can create assignments
create policy "supervisors create assignments" on public.ride_assignments
  for insert to authenticated
  with check (current_user_role() in ('supervisor', 'admin'));

-- ============================================================================
-- APPROVALS POLICIES
-- ============================================================================

-- Supervisors create approvals
create policy "supervisors create approvals" on public.approvals
  for insert to authenticated
  with check (current_user_role() in ('supervisor', 'admin'));

-- Read approvals by requester or supervisor
create policy "read approvals by requester or supervisor" on public.approvals
  for select to authenticated
  using (
    current_user_role() in ('supervisor', 'admin') or
    exists (
      select 1 from public.rides r 
      where r.id = ride_id and r.requester_id = current_user_id()
    )
  );

-- ============================================================================
-- RIDE POOLS POLICIES
-- ============================================================================

-- Drivers own their pools
create policy "drivers own pools" on public.ride_pools
  for all to authenticated
  using (driver_id = current_user_id() or current_user_role() in ('supervisor', 'admin'))
  with check (driver_id = current_user_id() or current_user_role() in ('supervisor', 'admin'));

-- ============================================================================
-- POOL PARTICIPANTS POLICIES
-- ============================================================================

-- Read participants by party (driver, participant, or supervisor)
create policy "read participants by party" on public.pool_participants
  for select to authenticated
  using (
    user_id = current_user_id() or
    exists (
      select 1 from public.ride_pools p 
      where p.id = pool_id and p.driver_id = current_user_id()
    ) or
    current_user_role() in ('supervisor', 'admin')
  );

-- Drivers can manage participants in their pools
create policy "drivers manage pool participants" on public.pool_participants
  for all to authenticated
  using (
    exists (
      select 1 from public.ride_pools p 
      where p.id = pool_id and p.driver_id = current_user_id()
    ) or
    current_user_role() in ('supervisor', 'admin')
  )
  with check (
    exists (
      select 1 from public.ride_pools p 
      where p.id = pool_id and p.driver_id = current_user_id()
    ) or
    current_user_role() in ('supervisor', 'admin')
  );

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can read their own notifications
create policy "read own notifications" on public.notifications
  for select to authenticated
  using (user_id = current_user_id());

-- Users can update their own notifications (mark as read)
create policy "update own notifications" on public.notifications
  for update to authenticated
  using (user_id = current_user_id())
  with check (user_id = current_user_id());

-- System can create notifications for any user
create policy "system creates notifications" on public.notifications
  for insert to authenticated
  with check (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
grant usage on schema public to authenticated;

-- Grant access to tables
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Grant usage on sequences
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table public.rides is 'Core ride requests from employees';
comment on table public.ride_claims is 'Driver claims on available rides';
comment on table public.ride_assignments is 'Final assignment of driver to ride';
comment on table public.ride_pools is 'Carpooling groups created by drivers';
comment on table public.pool_participants is 'Riders participating in a pool';
comment on table public.approvals is 'Supervisor approvals for ride requests';
comment on table public.notifications is 'User notifications for ride events';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================