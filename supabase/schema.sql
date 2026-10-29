-- FarmLedger database schema for Supabase.
-- Run this whole file in Supabase Dashboard > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'owner' check (role in ('owner','manager','worker')),
  created_at timestamptz not null default now()
);

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.farm_members (
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'worker' check (role in ('owner','manager','worker')),
  created_at timestamptz not null default now(),
  primary key (farm_id,user_id)
);

create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  crop_name text not null,
  area numeric(12,2),
  area_unit text not null default 'acre',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  category text not null check (category in ('pesticide','fertilizer')),
  name text not null,
  brand text not null default '',
  unit text not null check (unit in ('ml','L','g','kg','packet','bottle','bag','piece')),
  low_stock_threshold numeric(14,3) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('purchase','usage','adjustment')),
  transaction_date date not null default current_date,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  total_cost numeric(14,2) not null default 0 check (total_cost >= 0),
  supplier text not null default '',
  plot_id uuid references public.plots(id) on delete set null,
  purpose text not null default '',
  dosage text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.labour_entries (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  work_date date not null default current_date,
  work_category text not null default 'General work',
  worker_name text not null default '',
  worker_count integer not null default 1 check (worker_count > 0),
  days numeric(8,2) not null default 1 check (days > 0),
  rate_per_worker numeric(14,2) not null default 0 check (rate_per_worker >= 0),
  extra_cost numeric(14,2) not null default 0 check (extra_cost >= 0),
  plot_id uuid references public.plots(id) on delete set null,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.misc_expenses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  expense_date date not null default current_date,
  category text not null default 'Other',
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  payment_method text not null default 'Cash',
  plot_id uuid references public.plots(id) on delete set null,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Current stock is derived from transactions: purchases + adjustments - usage.
create or replace view public.inventory_balances as
select
  i.id as item_id,
  i.farm_id,
  i.category,
  i.name,
  i.brand,
  i.unit,
  i.low_stock_threshold,
  coalesce(sum(case
    when t.transaction_type in ('purchase','adjustment') then t.quantity
    when t.transaction_type = 'usage' then -t.quantity
    else 0 end),0) as quantity_remaining,
  coalesce(sum(case when t.transaction_type = 'purchase' then t.total_cost else 0 end),0) as total_purchase_cost,
  coalesce(sum(case when t.transaction_type = 'usage' then t.quantity else 0 end),0) as quantity_used
from public.inventory_items i
left join public.stock_transactions t on t.item_id=i.id
group by i.id;

-- New user profile created automatically. User still creates a farm from the app.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.plots enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.labour_entries enable row level security;
alter table public.misc_expenses enable row level security;

-- Membership helper avoids repeating membership logic in policies.
create or replace function public.is_farm_member(target_farm uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.farm_members fm where fm.farm_id=target_farm and fm.user_id=auth.uid())
$$;

create policy "profiles read self" on public.profiles for select using (id=auth.uid());
create policy "profiles update self" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());

create policy "farm members read farm" on public.farms for select using (public.is_farm_member(id) or owner_id=auth.uid());
create policy "owner create farm" on public.farms for insert with check (owner_id=auth.uid());
create policy "owner update farm" on public.farms for update using (owner_id=auth.uid()) with check (owner_id=auth.uid());

create policy "members read membership" on public.farm_members for select using (user_id=auth.uid() or public.is_farm_member(farm_id));
create policy "owner add members" on public.farm_members for insert with check (
  exists(select 1 from public.farms f where f.id=farm_id and f.owner_id=auth.uid())
);
create policy "owner remove members" on public.farm_members for delete using (
  exists(select 1 from public.farms f where f.id=farm_id and f.owner_id=auth.uid())
);

create policy "members read plots" on public.plots for select using (public.is_farm_member(farm_id));
create policy "members add plots" on public.plots for insert with check (public.is_farm_member(farm_id));
create policy "members update plots" on public.plots for update using (public.is_farm_member(farm_id)) with check (public.is_farm_member(farm_id));
create policy "managers delete plots" on public.plots for delete using (
  exists(select 1 from public.farm_members fm where fm.farm_id=plots.farm_id and fm.user_id=auth.uid() and fm.role in ('owner','manager'))
);

create policy "members read items" on public.inventory_items for select using (public.is_farm_member(farm_id));
create policy "members add items" on public.inventory_items for insert with check (public.is_farm_member(farm_id));
create policy "members update items" on public.inventory_items for update using (public.is_farm_member(farm_id)) with check (public.is_farm_member(farm_id));
create policy "managers delete items" on public.inventory_items for delete using (
  exists(select 1 from public.farm_members fm where fm.farm_id=inventory_items.farm_id and fm.user_id=auth.uid() and fm.role in ('owner','manager'))
);

create policy "members read stock tx" on public.stock_transactions for select using (public.is_farm_member(farm_id));
create policy "members add stock tx" on public.stock_transactions for insert with check (public.is_farm_member(farm_id));
create policy "managers delete stock tx" on public.stock_transactions for delete using (
  exists(select 1 from public.farm_members fm where fm.farm_id=stock_transactions.farm_id and fm.user_id=auth.uid() and fm.role in ('owner','manager'))
);

create policy "members read labour" on public.labour_entries for select using (public.is_farm_member(farm_id));
create policy "members add labour" on public.labour_entries for insert with check (public.is_farm_member(farm_id));
create policy "managers delete labour" on public.labour_entries for delete using (
  exists(select 1 from public.farm_members fm where fm.farm_id=labour_entries.farm_id and fm.user_id=auth.uid() and fm.role in ('owner','manager'))
);

create policy "members read misc" on public.misc_expenses for select using (public.is_farm_member(farm_id));
create policy "members add misc" on public.misc_expenses for insert with check (public.is_farm_member(farm_id));
create policy "managers delete misc" on public.misc_expenses for delete using (
  exists(select 1 from public.farm_members fm where fm.farm_id=misc_expenses.farm_id and fm.user_id=auth.uid() and fm.role in ('owner','manager'))
);

-- Note: a view may not automatically enforce the same RLS as its source tables on all setups.
-- The app calculates balances from the protected stock_transactions table instead.
