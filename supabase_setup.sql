-- ============================================================
-- WMS Pro — Script khởi tạo database cho Supabase
-- Cách dùng: Mở Supabase Dashboard > SQL Editor > New query
-- > dán toàn bộ nội dung file này > bấm Run
-- ============================================================

-- Bật extension để tự sinh UUID làm khóa chính
create extension if not exists "pgcrypto";

-- ----------------------------
-- Bảng: locations (Vị trí kho)
-- ----------------------------
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,
  code text,
  description text
);

-- ----------------------------
-- Bảng: pallets (Pallet)
-- ----------------------------
create table if not exists public.pallets (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,
  location_id text,
  location_name text,
  notes text,
  status text not null default 'in_stock' check (status in ('in_stock', 'exported')),
  exported_date timestamptz,
  exported_note text,
  barcode text
);

-- ----------------------------
-- Bảng: goods (Hàng hóa)
-- ----------------------------
create table if not exists public.goods (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  user_id uuid references auth.users(id) default auth.uid(),
  sku text,
  name text not null,
  order_id text,
  supplier text,
  damage_rate numeric,
  weight_kg numeric,
  received_date timestamptz,
  notes text,
  type text not null check (type in ('Box', 'Bulky')),
  quantity numeric,
  pallet_id text,
  pallet_name text,
  location_name text,
  thang numeric,
  quy numeric,
  nam numeric,
  time_warning boolean default false,
  raw_time_text text,
  status text not null default 'in_stock' check (status in ('in_stock', 'exported')),
  exported_date timestamptz,
  exported_note text,
  barcode text
);

-- Index giúp các truy vấn lọc theo status nhanh hơn (app lọc rất nhiều theo status)
create index if not exists idx_pallets_status on public.pallets(status);
create index if not exists idx_goods_status on public.goods(status);

-- ============================================================
-- Row Level Security (RLS): đảm bảo MỖI tài khoản chỉ thấy và
-- sửa được dữ liệu kho của chính mình, kể cả khi nhiều người
-- cùng đăng ký dùng app.
-- ============================================================

alter table public.locations enable row level security;
alter table public.pallets enable row level security;
alter table public.goods enable row level security;

-- Locations: chỉ chủ sở hữu (user_id) mới được xem / thêm / sửa / xóa
create policy "locations_select_own" on public.locations
  for select using (auth.uid() = user_id);
create policy "locations_insert_own" on public.locations
  for insert with check (auth.uid() = user_id);
create policy "locations_update_own" on public.locations
  for update using (auth.uid() = user_id);
create policy "locations_delete_own" on public.locations
  for delete using (auth.uid() = user_id);

-- Pallets
create policy "pallets_select_own" on public.pallets
  for select using (auth.uid() = user_id);
create policy "pallets_insert_own" on public.pallets
  for insert with check (auth.uid() = user_id);
create policy "pallets_update_own" on public.pallets
  for update using (auth.uid() = user_id);
create policy "pallets_delete_own" on public.pallets
  for delete using (auth.uid() = user_id);

-- Goods
create policy "goods_select_own" on public.goods
  for select using (auth.uid() = user_id);
create policy "goods_insert_own" on public.goods
  for insert with check (auth.uid() = user_id);
create policy "goods_update_own" on public.goods
  for update using (auth.uid() = user_id);
create policy "goods_delete_own" on public.goods
  for delete using (auth.uid() = user_id);

-- ============================================================
-- LƯU Ý CHO TRƯỜNG HỢP NHIỀU NGƯỜI DÙNG CHUNG 1 KHO:
-- Nếu bạn và đồng nghiệp cùng muốn xem chung 1 dữ liệu kho (không
-- phải mỗi người 1 kho riêng), hãy chạy đoạn SQL dưới đây THAY VÌ
-- các policy "_own" ở trên, để mọi tài khoản đã đăng nhập đều thấy
-- chung dữ liệu:
--
-- drop policy "locations_select_own" on public.locations;
-- drop policy "locations_insert_own" on public.locations;
-- drop policy "locations_update_own" on public.locations;
-- drop policy "locations_delete_own" on public.locations;
-- create policy "locations_all_authenticated" on public.locations
--   for all using (auth.role() = 'authenticated')
--   with check (auth.role() = 'authenticated');
-- (lặp lại tương tự cho pallets và goods)
-- ============================================================
