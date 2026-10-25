-- Run this once in Supabase Dashboard > SQL Editor.
-- Replace admin@example.com below with the email you will create in Supabase Auth.

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text not null check (char_length(description) between 1 and 500),
  price numeric(10, 2) check (price is null or price >= 0),
  image text not null default '',
  url text not null default '',
  reserved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wishlist_items enable row level security;
revoke all on public.wishlist_items from anon, authenticated;
grant select on public.wishlist_items to anon, authenticated;
grant insert, update, delete on public.wishlist_items to authenticated;

drop policy if exists "Anyone can view wishlist items" on public.wishlist_items;
create policy "Anyone can view wishlist items"
  on public.wishlist_items for select to anon using (true);

drop policy if exists "Authorized admin manages wishlist items" on public.wishlist_items;
create policy "Authorized admin manages wishlist items"
  on public.wishlist_items for all to authenticated
  using ((select auth.jwt() ->> 'email') = 'Bibek.khanal.2007@gmail.com')
  with check ((select auth.jwt() ->> 'email') = 'Bibek.khanal.2007@gmail.com');

-- Public visitors can reserve an item, but cannot edit item details or clear a reservation.
create or replace function public.reserve_wishlist_item(p_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.wishlist_items
     set reserved = true, updated_at = now()
   where id = p_item_id and reserved = false;
  return found;
end;
$$;

revoke all on function public.reserve_wishlist_item(uuid) from public;
grant execute on function public.reserve_wishlist_item(uuid) to anon, authenticated;

-- Enable live updates for the public wishlist and manager.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'wishlist_items'
  ) then
    alter publication supabase_realtime add table public.wishlist_items;
  end if;
end;
$$;
