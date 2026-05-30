-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MECANI-KOC DATABASE SCHEMA & POLICIES (MIGRACIÓN & INSTALACIÓN COMPLETA)
-- Ejecutar este script en el SQL Editor de Supabase
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- =========================================================================
-- PARTE A: SI YA TIENES LA BASE DE DATOS ANTERIOR (MIGRACIÓN RÁPIDA)
-- =========================================================================
-- Si ya creaste las tablas anteriores, ejecuta solo estas líneas para migrar a Soles y ofertas:
/*
ALTER TABLE public.usuarios RENAME COLUMN zoles TO soles;
ALTER TABLE public.movimientos_zoles RENAME TO movimientos_soles;
DROP POLICY IF EXISTS "Permitir movimientos de zoles a autenticados" ON public.movimientos_soles;
CREATE POLICY "Permitir movimientos de soles a autenticados" ON public.movimientos_soles FOR ALL USING (true);

ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS en_oferta boolean DEFAULT false;
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS precio_oferta numeric;

CREATE TABLE IF NOT EXISTS public.solicitudes_entrega (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor_id bigint REFERENCES public.usuarios(id) ON DELETE CASCADE,
    producto_id bigint REFERENCES public.productos(id) ON DELETE CASCADE,
    sucursal_id bigint REFERENCES public.sucursales(id) ON DELETE CASCADE,
    cantidad integer NOT NULL CHECK (cantidad > 0),
    estado text NOT NULL DEFAULT 'pendiente',
    fecha timestamp with time zone DEFAULT now()
);
ALTER TABLE public.solicitudes_entrega ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir solicitudes a autenticados" ON public.solicitudes_entrega FOR ALL USING (true);
*/


-- =========================================================================
-- PARTE B: INSTALACIÓN DESDE CERO
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.sucursales (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL,
    ubicacion text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categorias (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.proveedores (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    email text NOT NULL,
    rol_id integer NOT NULL DEFAULT 1, -- 1: cliente, 2: admin, 3: proveedor
    soles numeric NOT NULL DEFAULT 1000,
    sucursal_id bigint REFERENCES public.sucursales(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.productos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL,
    descripcion text,
    precio numeric NOT NULL,
    imagen_url text,
    categoria_id bigint REFERENCES public.categorias(id) ON DELETE SET NULL,
    proveedor_id bigint REFERENCES public.proveedores(id) ON DELETE SET NULL,
    activo boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.inventario (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto_id bigint NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    sucursal_id bigint NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
    stock integer NOT NULL DEFAULT 0,
    en_oferta boolean DEFAULT false,
    precio_oferta numeric,
    CONSTRAINT producto_sucursal_unique UNIQUE (producto_id, sucursal_id)
);

CREATE TABLE IF NOT EXISTS public.pedidos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    sucursal_id bigint REFERENCES public.sucursales(id) ON DELETE SET NULL,
    total numeric NOT NULL,
    estado text NOT NULL DEFAULT 'completado',
    fecha timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.detalle_pedido (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    producto_id bigint REFERENCES public.productos(id) ON DELETE SET NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto_id bigint REFERENCES public.productos(id) ON DELETE SET NULL,
    sucursal_id bigint REFERENCES public.sucursales(id) ON DELETE SET NULL,
    tipo text NOT NULL, -- 'entrada' o 'salida'
    cantidad integer NOT NULL,
    fecha timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.movimientos_soles (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo text NOT NULL, -- 'compra', 'recarga', 'devolucion'
    monto numeric NOT NULL,
    fecha timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solicitudes_entrega (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor_id bigint REFERENCES public.usuarios(id) ON DELETE CASCADE,
    producto_id bigint REFERENCES public.productos(id) ON DELETE CASCADE,
    sucursal_id bigint REFERENCES public.sucursales(id) ON DELETE CASCADE,
    cantidad integer NOT NULL CHECK (cantidad > 0),
    estado text NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    fecha timestamp with time zone DEFAULT now()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DATOS DE SEMILLA (SEED DATA)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Sucursales
INSERT INTO public.sucursales (nombre, ubicacion) VALUES
('Sede Norte - Carabayllo', 'Av. Universitaria 4500, Lima'),
('Sede Sur - Chorrillos', 'Av. Defensores del Morro 120, Lima'),
('Sede Este - Ate Vitarte', 'Av. Nicolás de Ayllón 2300, Lima')
ON CONFLICT DO NOTHING;

-- Categorías
INSERT INTO public.categorias (nombre) VALUES
('Repuestos Motor'),
('Frenos & Suspensión'),
('Líquidos & Aditivos'),
('Herramientas')
ON CONFLICT DO NOTHING;

-- Proveedores
INSERT INTO public.proveedores (nombre) VALUES
('Bosch Automotive'),
('Toyota Genuine Parts'),
('Mobil Oil Corp'),
('Sata Tools')
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SEGURIDAD DE FILA (ROW LEVEL SECURITY - RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_soles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_entrega ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS
CREATE POLICY "Permitir lectura de sucursales a todos" ON public.sucursales FOR SELECT USING (true);
CREATE POLICY "Permitir insertar/modificar sucursales a todos" ON public.sucursales FOR ALL USING (true);

CREATE POLICY "Permitir lectura de categorias a todos" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Permitir escrituras a todos" ON public.categorias FOR ALL USING (true);

CREATE POLICY "Permitir lectura de proveedores a todos" ON public.proveedores FOR SELECT USING (true);
CREATE POLICY "Permitir escrituras a todos" ON public.proveedores FOR ALL USING (true);

CREATE POLICY "Permitir lectura de productos a todos" ON public.productos FOR SELECT USING (true);
CREATE POLICY "Permitir escrituras a todos" ON public.productos FOR ALL USING (true);

CREATE POLICY "Permitir lectura de inventario a todos" ON public.inventario FOR SELECT USING (true);
CREATE POLICY "Permitir actualizar stock a autenticados" ON public.inventario FOR ALL USING (true);

CREATE POLICY "Permitir lectura de usuarios a autenticados" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir crear registro propio" ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizar registro propio" ON public.usuarios FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Permitir pedidos a autenticados" ON public.pedidos FOR ALL USING (true);
CREATE POLICY "Permitir detalles de pedidos a autenticados" ON public.detalle_pedido FOR ALL USING (true);
CREATE POLICY "Permitir movimientos de inventario a autenticados" ON public.movimientos_inventario FOR ALL USING (true);
CREATE POLICY "Permitir movimientos de soles a autenticados" ON public.movimientos_soles FOR ALL USING (true);
CREATE POLICY "Permitir solicitudes a autenticados" ON public.solicitudes_entrega FOR ALL USING (true);
