-- Materiales Centro — esquema de base de datos (Supabase / PostgreSQL)
-- Corresponde a la Fase 0 (ver documento "Materiales Centro — Arquitectura e-commerce").
-- Etapa 1: categories, products, stock_movements están en uso real.
-- Etapa 2 (preparado, sin uso todavía): customers, inquiries, orders, order_items, payments.
--
-- Cómo aplicar: pegar este archivo entero en Supabase → SQL Editor → Run.
-- Es seguro de correr una sola vez sobre un proyecto nuevo y vacío.

create extension if not exists "pgcrypto";

-- =========================================================
-- ETAPA 1 — en uso
-- =========================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  parent_id uuid references categories(id) on delete restrict,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  marca text,
  rubro_id uuid not null references categories(id) on delete restrict,
  subcategoria_id uuid references categories(id) on delete restrict,
  unidad text not null default 'unidad',
  precio numeric(12,2),
  stock integer not null default 0,
  foto text,
  destacado boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_rubro_idx on products(rubro_id);
create index products_subcategoria_idx on products(subcategoria_id);
create index products_activo_idx on products(activo);

-- Ledger de stock: cada cambio queda registrado, nunca se pisa el número
-- a ciegas. tipo: 'ingreso' | 'ajuste' | 'venta' | 'devolucion'
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'ajuste', 'venta', 'devolucion')),
  cantidad integer not null, -- positivo = suma, negativo = resta
  nota text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index stock_movements_product_idx on stock_movements(product_id);

-- =========================================================
-- ETAPA 2 — tablas preparadas, sin uso todavía
-- =========================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  created_at timestamptz not null default now()
);

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  mensaje text not null,
  origen_pagina text,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'cancelado')),
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  nombre_producto text not null, -- copia del nombre al momento de compra
  unit_price numeric(12,2) not null, -- precio capturado al momento de compra, nunca recalculado
  cantidad integer not null,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  proveedor text not null default 'mercadopago',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  monto numeric(12,2) not null,
  external_id text, -- id de la transacción en Mercado Pago
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table categories enable row level security;
alter table products enable row level security;
alter table stock_movements enable row level security;
alter table customers enable row level security;
alter table inquiries enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

-- Público: solo lectura de categorías y de productos activos.
create policy "categorias publicas de lectura" on categories
  for select using (true);

create policy "productos activos de lectura publica" on products
  for select using (activo = true);

-- Administración: cualquier usuario autenticado (vos, desde el panel) puede
-- gestionar productos y categorías. Como el panel es de un solo uso interno,
-- "autenticado" alcanza como regla; no hace falta un rol separado por ahora.
create policy "admin gestiona productos" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin gestiona categorias" on categories
  for insert with check (auth.role() = 'authenticated');
create policy "admin edita categorias" on categories
  for update using (auth.role() = 'authenticated');

create policy "admin gestiona stock" on stock_movements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Etapa 2: todavía nadie puede tocar estas tablas (ni público ni admin) hasta
-- que se diseñe el flujo de checkout/pagos. Quedan creadas pero cerradas.
-- (No se agregan policies: sin policies + RLS activado = nadie entra, ni
-- siquiera el dueño del proyecto por la API pública.)

-- =========================================================
-- Vista pública: mismo formato plano que ya usa el sitio (assets/data/productos.json)
-- así el frontend no tiene que cambiar su forma de leer los datos.
-- =========================================================

create view products_public as
select
  p.id,
  p.nombre,
  r.slug as rubro,
  r.nombre as "rubroLabel",
  s.slug as subcategoria,
  s.nombre as "subcategoriaLabel",
  p.unidad,
  p.precio,
  p.foto,
  p.destacado,
  p.activo,
  p.orden
from products p
join categories r on p.rubro_id = r.id
left join categories s on p.subcategoria_id = s.id
where p.activo = true;

-- =========================================================
-- Semilla: rubros y subcategorías (coinciden con los slugs ya usados en
-- los links del sitio: catalogo.html?rubro=corralon&sub=cemento, etc.)
-- =========================================================

insert into categories (slug, nombre, parent_id, orden) values
  ('terminaciones', 'Terminaciones', null, 1),
  ('corralon', 'Corralón', null, 2),
  ('construccion-en-seco', 'Construcción en seco', null, 3),
  ('instalaciones', 'Instalaciones', null, 4),
  ('herramientas', 'Herramientas', null, 5),
  ('articulos-para-el-hogar', 'Artículos para el hogar', null, 6);

insert into categories (slug, nombre, parent_id, orden) values
  ('pisos-y-revestimientos', 'Pisos y revestimientos', (select id from categories where slug = 'terminaciones'), 1),
  ('griferia', 'Grifería', (select id from categories where slug = 'terminaciones'), 2),
  ('sanitarios', 'Sanitarios', (select id from categories where slug = 'terminaciones'), 3),
  ('amoblamientos-de-bano', 'Amoblamientos de baño', (select id from categories where slug = 'terminaciones'), 4),
  ('piletas-de-acero-y-accesorios', 'Piletas de acero y accesorios', (select id from categories where slug = 'terminaciones'), 5);

insert into categories (slug, nombre, parent_id, orden) values
  ('cemento', 'Cementos', (select id from categories where slug = 'corralon'), 1),
  ('cales', 'Cales', (select id from categories where slug = 'corralon'), 2),
  ('aridos', 'Áridos', (select id from categories where slug = 'corralon'), 3),
  ('ladrillos', 'Ladrillos', (select id from categories where slug = 'corralon'), 4),
  ('hierros-y-mallas', 'Hierros y mallas', (select id from categories where slug = 'corralon'), 5),
  ('viguetas', 'Viguetas', (select id from categories where slug = 'corralon'), 6),
  ('adhesivos', 'Adhesivos para cerámicos y porcelanatos', (select id from categories where slug = 'corralon'), 7),
  ('membranas', 'Membranas', (select id from categories where slug = 'corralon'), 8),
  ('aditivos', 'Aditivos y aislantes hidrófugos', (select id from categories where slug = 'corralon'), 9),
  ('aislantes-termicos', 'Aislantes térmicos', (select id from categories where slug = 'corralon'), 10),
  ('pinturas', 'Pinturas', (select id from categories where slug = 'corralon'), 11);

insert into categories (slug, nombre, parent_id, orden) values
  ('placas-de-yeso', 'Placas de yeso', (select id from categories where slug = 'construccion-en-seco'), 1),
  ('perfileria-dry-wall-y-steel-frame', 'Perfilería dry wall y Steel frame', (select id from categories where slug = 'construccion-en-seco'), 2),
  ('aislantes', 'Aislantes', (select id from categories where slug = 'construccion-en-seco'), 3),
  ('accesorios', 'Accesorios', (select id from categories where slug = 'construccion-en-seco'), 4);

insert into categories (slug, nombre, parent_id, orden) values
  ('instalacion-de-agua', 'Instalación de agua', (select id from categories where slug = 'instalaciones'), 1),
  ('instalacion-de-gas', 'Instalación de gas', (select id from categories where slug = 'instalaciones'), 2),
  ('instalacion-de-cloacas', 'Instalación de cloacas', (select id from categories where slug = 'instalaciones'), 3);

insert into categories (slug, nombre, parent_id, orden) values
  ('herramientas-electricas-y-de-mano', 'Herramientas eléctricas y de mano', (select id from categories where slug = 'herramientas'), 1),
  ('fijaciones-y-tornilleria', 'Fijaciones y tornillería', (select id from categories where slug = 'herramientas'), 2),
  ('discos-de-corte', 'Discos de corte', (select id from categories where slug = 'herramientas'), 3),
  ('ferreteria', 'Ferretería', (select id from categories where slug = 'herramientas'), 4);

insert into categories (slug, nombre, parent_id, orden) values
  ('cocinas', 'Cocinas', (select id from categories where slug = 'articulos-para-el-hogar'), 1),
  ('hornos', 'Hornos', (select id from categories where slug = 'articulos-para-el-hogar'), 2),
  ('anafes', 'Anafes', (select id from categories where slug = 'articulos-para-el-hogar'), 3),
  ('campana-y-extractores', 'Campana y extractores', (select id from categories where slug = 'articulos-para-el-hogar'), 4),
  ('calefaccion-y-agua-caliente', 'Calefacción y agua caliente', (select id from categories where slug = 'articulos-para-el-hogar'), 5);
