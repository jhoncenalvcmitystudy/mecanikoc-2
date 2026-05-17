// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Servicio de Productos — Queries Supabase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from '../core/supabaseClient.js';

/**
 * Obtiene todos los productos con categorías, proveedores e inventario.
 * El inventario incluye info de sucursal para el desglose por sede.
 */
export async function obtenerProductosConInventario() {
    const { data, error } = await supabase
        .from('productos')
        .select(`
            *,
            categorias(nombre),
            proveedores(nombre),
            inventario(id, stock, sucursal_id, sucursales(nombre, ubicacion))
        `);

    if (error) throw error;

    return data.map(p => ({
        id:           p.id,
        nombre:       p.nombre,
        descripcion:  p.descripcion || '',
        precio:       p.precio,
        imagen_url:   p.imagen_url || null,
        categoria_id: p.categoria_id,
        proveedor_id: p.proveedor_id,
        activo:       p.activo !== false,
        categoria:    p.categorias?.nombre || 'Sin categoría',
        proveedor:    p.proveedores?.nombre || '—',
        stock_total:  p.inventario
            ? p.inventario.reduce((acc, inv) => acc + (inv.stock || 0), 0)
            : 0,
        // Inventario por sucursal: [{ id, stock, sucursal_id, sucursal_nombre }]
        inventario: (p.inventario || []).map(inv => ({
            id:             inv.id,
            stock:          inv.stock || 0,
            sucursal_id:    inv.sucursal_id,
            sucursal_nombre: inv.sucursales?.nombre || '—',
            sucursal_ubicacion: inv.sucursales?.ubicacion || ''
        }))
    }));
}

/**
 * Obtiene todas las categorías de productos.
 */
export async function obtenerCategorias() {
    const { data, error } = await supabase.from('categorias').select('*');
    if (error) throw error;
    return data;
}

/**
 * Actualiza el stock de un registro de inventario por su ID.
 */
export async function actualizarStock(invId, newStock) {
    const { error } = await supabase
        .from('inventario')
        .update({ stock: newStock })
        .eq('id', invId);
    if (error) throw error;
}

/**
 * Obtiene el stock actual de un registro de inventario.
 */
export async function obtenerStockActual(invId) {
    const { data, error } = await supabase
        .from('inventario')
        .select('stock, sucursal_id')
        .eq('id', invId)
        .single();
    if (error) throw error;
    return { stock: data.stock || 0, sucursal_id: data.sucursal_id };
}

/**
 * Registra un movimiento de inventario (entrada o salida).
 * sucursalId es obligatorio según el esquema de la BD.
 *
 * @param {number} productoId
 * @param {number} sucursalId
 * @param {string} tipo        - 'entrada' | 'salida'
 * @param {number} cantidad
 */
export async function registrarMovimientoInventario(productoId, sucursalId, tipo, cantidad) {
    const { error } = await supabase
        .from('movimientos_inventario')
        .insert([{
            producto_id:  productoId,
            sucursal_id:  sucursalId,
            tipo,
            cantidad
        }]);
    if (error) throw error;
}

/**
 * Obtiene los últimos movimientos de inventario con nombre de producto y sucursal.
 */
export async function obtenerMovimientosInventario(limit = 30) {
    const { data, error } = await supabase
        .from('movimientos_inventario')
        .select('*, productos(nombre), sucursales(nombre)')
        .order('id', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data || [];
}
