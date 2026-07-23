-- ============================================================
-- ESQUEMA DE BASE DE DATOS — App de gestión de sastrería
-- Ejecutar esto completo en Supabase: SQL Editor > New Query > Run
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLA: clientes
-- ------------------------------------------------------------
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  telefono text,
  poblacion text,
  notas text,
  creado_en timestamptz default now()
);

-- ------------------------------------------------------------
-- TABLA: medidas
-- Un registro de medidas por cliente (se actualiza, no se
-- duplica, salvo que quieras historial de medidas también,
-- ver nota al final del archivo)
-- ------------------------------------------------------------
create table medidas (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade unique,
  genero text check (genero in ('hombre', 'mujer')) default 'hombre',
  -- Básicas
  altura numeric,
  cuello numeric,
  pecho numeric,
  cintura_natural numeric,
  cadera numeric,
  largo_manga numeric,
  entrepierna numeric,
  largo_exterior numeric,
  -- Avanzadas (todas desbloqueadas, sin "Solo Pro")
  hombro numeric,
  espalda_ancho numeric,
  bicep numeric,
  muneca numeric,
  muslo numeric,
  rodilla numeric,
  bajo_pantalon numeric,
  talle_espalda numeric,
  talle_delantero numeric,
  actualizado_en timestamptz default now()
);

-- ------------------------------------------------------------
-- TABLA: pedidos (trabajos)
-- ------------------------------------------------------------
create table pedidos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade not null,
  rubro text check (rubro in ('sastreria', 'camiseria', 'medida_industrial')) not null default 'sastreria',
  descripcion text,             -- ej. "Traje 2 piezas azul marino"
  estado text check (estado in ('pendiente', 'en_corte', 'primera_prueba', 'finalizado', 'entregado')) not null default 'pendiente',
  tejido_referencia text,       -- código o texto libre de la tela
  tejido_foto_url text,         -- URL en Supabase Storage (opcional)
  precio_total numeric default 0,
  anticipo numeric default 0,
  fecha_entrega_estimada date,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

-- ------------------------------------------------------------
-- TABLA: pagos
-- Historial de pagos por pedido (anticipo + abonos + saldo)
-- ------------------------------------------------------------
create table pagos (
  id uuid primary key default uuid_generate_v4(),
  pedido_id uuid references pedidos(id) on delete cascade not null,
  monto numeric not null,
  nota text,
  fecha timestamptz default now()
);

-- ------------------------------------------------------------
-- Índices para que las listas carguen rápido con 200+ registros
-- ------------------------------------------------------------
create index idx_pedidos_cliente on pedidos(cliente_id);
create index idx_pedidos_estado on pedidos(estado);
create index idx_pagos_pedido on pagos(pedido_id);

-- ------------------------------------------------------------
-- Seguridad: como esta app la usas solo tú, dejamos acceso
-- abierto con la clave anon (protegida por ser secreta, no
-- pública). Si luego quieres multiusuario con login, se
-- añaden políticas RLS por usuario.
-- ------------------------------------------------------------
alter table clientes enable row level security;
alter table medidas enable row level security;
alter table pedidos enable row level security;
alter table pagos enable row level security;

create policy "acceso total clientes" on clientes for all using (true) with check (true);
create policy "acceso total medidas" on medidas for all using (true) with check (true);
create policy "acceso total pedidos" on pedidos for all using (true) with check (true);
create policy "acceso total pagos" on pagos for all using (true) with check (true);

-- ------------------------------------------------------------
-- NOTA: para las fotos de tejido, crea un bucket de Storage
-- llamado "tejidos" desde el panel de Supabase (Storage > New
-- bucket > público). El código de la app ya apunta ahí.
-- ------------------------------------------------------------
