-- Gregory Catalog Generator - initial schema
create extension if not exists "pgcrypto";

create table if not exists public.catalogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'error')),
  cover_enabled boolean not null default true,
  token_overrides jsonb not null default '{}'::jsonb,
  pdf_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  position integer not null default 0,
  image_path text not null,
  image_url text not null,
  image_ratio numeric,
  sku text not null default '',
  product_type text not null default '',
  description text not null default '',
  original_price numeric(10,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  final_price numeric(10,2) not null default 0,
  sizes text not null default '',
  ai_status text not null default 'pending' check (ai_status in ('pending', 'queued', 'processing', 'done', 'failed')),
  ai_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_catalog_position on public.products(catalog_id, position);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  total_items integer not null default 0,
  completed_items integer not null default 0,
  failed_items integer not null default 0,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_jobs_catalog on public.ai_jobs(catalog_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_catalogs_updated_at on public.catalogs;
create trigger trg_catalogs_updated_at
before update on public.catalogs
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_ai_jobs_updated_at on public.ai_jobs;
create trigger trg_ai_jobs_updated_at
before update on public.ai_jobs
for each row execute procedure public.set_updated_at();

alter table public.catalogs enable row level security;
alter table public.products enable row level security;
alter table public.ai_jobs enable row level security;

drop policy if exists "catalogs_select_own" on public.catalogs;
create policy "catalogs_select_own" on public.catalogs
for select using (created_by = auth.uid());

drop policy if exists "catalogs_insert_own" on public.catalogs;
create policy "catalogs_insert_own" on public.catalogs
for insert with check (created_by = auth.uid());

drop policy if exists "catalogs_update_own" on public.catalogs;
create policy "catalogs_update_own" on public.catalogs
for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "catalogs_delete_own" on public.catalogs;
create policy "catalogs_delete_own" on public.catalogs
for delete using (created_by = auth.uid());

drop policy if exists "products_select_catalog_owner" on public.products;
create policy "products_select_catalog_owner" on public.products
for select using (
  exists (
    select 1
    from public.catalogs c
    where c.id = products.catalog_id and c.created_by = auth.uid()
  )
);

drop policy if exists "products_insert_catalog_owner" on public.products;
create policy "products_insert_catalog_owner" on public.products
for insert with check (
  exists (
    select 1
    from public.catalogs c
    where c.id = products.catalog_id and c.created_by = auth.uid()
  )
);

drop policy if exists "products_update_catalog_owner" on public.products;
create policy "products_update_catalog_owner" on public.products
for update using (
  exists (
    select 1
    from public.catalogs c
    where c.id = products.catalog_id and c.created_by = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.catalogs c
    where c.id = products.catalog_id and c.created_by = auth.uid()
  )
);

drop policy if exists "products_delete_catalog_owner" on public.products;
create policy "products_delete_catalog_owner" on public.products
for delete using (
  exists (
    select 1
    from public.catalogs c
    where c.id = products.catalog_id and c.created_by = auth.uid()
  )
);

drop policy if exists "ai_jobs_select_catalog_owner" on public.ai_jobs;
create policy "ai_jobs_select_catalog_owner" on public.ai_jobs
for select using (
  exists (
    select 1
    from public.catalogs c
    where c.id = ai_jobs.catalog_id and c.created_by = auth.uid()
  )
);

drop policy if exists "ai_jobs_insert_catalog_owner" on public.ai_jobs;
create policy "ai_jobs_insert_catalog_owner" on public.ai_jobs
for insert with check (
  exists (
    select 1
    from public.catalogs c
    where c.id = ai_jobs.catalog_id and c.created_by = auth.uid()
  )
);

drop policy if exists "ai_jobs_update_catalog_owner" on public.ai_jobs;
create policy "ai_jobs_update_catalog_owner" on public.ai_jobs
for update using (
  exists (
    select 1
    from public.catalogs c
    where c.id = ai_jobs.catalog_id and c.created_by = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.catalogs c
    where c.id = ai_jobs.catalog_id and c.created_by = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('catalog-pdfs', 'catalog-pdfs', false)
on conflict (id) do nothing;

drop policy if exists "catalog_images_read" on storage.objects;
create policy "catalog_images_read"
on storage.objects
for select
using (bucket_id = 'catalog-images');

drop policy if exists "catalog_images_write_auth" on storage.objects;
create policy "catalog_images_write_auth"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'catalog-images');

drop policy if exists "catalog_images_update_auth" on storage.objects;
create policy "catalog_images_update_auth"
on storage.objects
for update
to authenticated
using (bucket_id = 'catalog-images')
with check (bucket_id = 'catalog-images');

drop policy if exists "catalog_pdfs_read_auth" on storage.objects;
create policy "catalog_pdfs_read_auth"
on storage.objects
for select
to authenticated
using (bucket_id = 'catalog-pdfs');

drop policy if exists "catalog_pdfs_write_auth" on storage.objects;
create policy "catalog_pdfs_write_auth"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'catalog-pdfs');

drop policy if exists "catalog_pdfs_update_auth" on storage.objects;
create policy "catalog_pdfs_update_auth"
on storage.objects
for update
to authenticated
using (bucket_id = 'catalog-pdfs')
with check (bucket_id = 'catalog-pdfs');
