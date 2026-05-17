// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Servicio de Sucursales — CRUD + inventario por sucursal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from '../core/supabaseClient.js';

/**
 * Obtiene todas las sucursales ordenadas por ID.
 */
export async function obtenerSucursales() {
    const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .order('id');
    if (error) {
        console.warn('⚠️ No se pudieron cargar sucursales (RLS?):', error.message);
        return [];
    }
    return data || [];
}

/**
 * Crea una nueva sucursal y la devuelve.
 */
export async function crearSucursal(nombre, ubicacion) {
    const { data, error } = await supabase
        .from('sucursales')
        .insert([{ nombre, ubicacion }])
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

/**
 * Actualiza el nombre y/o ubicación de una sucursal.
 */
export async function editarSucursal(id, nombre, ubicacion) {
    const { data, error } = await supabase
        .from('sucursales')
        .update({ nombre, ubicacion })
        .eq('id', id)
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

/**
 * Elimina una sucursal por ID.
 * Lanzará error si tiene inventario o pedidos asociados (FK constraint).
 */
export async function eliminarSucursal(id) {
    const { error } = await supabase
        .from('sucursales')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

/**
 * Obtiene el inventario completo de una sucursal específica,
 * con información del producto (nombre, precio, categoría).
 */
export async function obtenerInventarioPorSucursal(sucursalId) {
    const { data, error } = await supabase
        .from('inventario')
        .select('id, stock, productos(id, nombre, precio, categorias(nombre))')
        .eq('sucursal_id', sucursalId)
        .order('id');
    if (error) throw error;
    return data || [];
}

/**
 * Obtiene el inventario de todas las sucursales agrupado,
 * útil para ver el stock global con desglose por sede.
 */
export async function obtenerInventarioGlobal() {
    const { data, error } = await supabase
        .from('inventario')
        .select('id, stock, sucursal_id, sucursales(nombre, ubicacion), productos(id, nombre, precio)')
        .order('sucursal_id');
    if (error) throw error;
    return data || [];
}
