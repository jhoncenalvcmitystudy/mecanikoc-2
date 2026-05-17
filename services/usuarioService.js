// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Servicio de Usuario — Queries Supabase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from '../core/supabaseClient.js';

/**
 * Obtiene todos los pedidos de un usuario ordenados por más reciente.
 * Incluye nombre de la sucursal de cada pedido.
 */
export async function obtenerPedidosDeUsuario(userId) {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*, sucursales(nombre, ubicacion)')
        .eq('usuario_id', userId)
        .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Obtiene los últimos movimientos de Zoles de un usuario.
 */
export async function obtenerMovimientosZoles(userId, limit = 10) {
    const { data, error } = await supabase
        .from('movimientos_zoles')
        .select('*')
        .eq('usuario_id', userId)
        .order('id', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Obtiene todos los usuarios con su sucursal asignada (solo para admin).
 */
export async function obtenerTodosLosUsuarios() {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*, sucursales(nombre, ubicacion)')
        .order('id');
    if (error) throw error;
    return data || [];
}

/**
 * Obtiene todos los pedidos con sucursal (solo para admin).
 */
export async function obtenerTodosLosPedidos() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*, sucursales(nombre, ubicacion)')
        .order('id', { ascending: false });
    if (error) throw error;
    return data || [];
}

/**
 * Asigna una sucursal a un usuario (solo admin puede llamar esto).
 * Para clientes: su sucursal preferida de compra.
 * Para admin/proveedor: su sede de trabajo.
 * Pasa null para desasignar.
 */
export async function asignarSucursalAUsuario(userId, sucursalId) {
    const { data, error } = await supabase
        .from('usuarios')
        .update({ sucursal_id: sucursalId })
        .eq('id', userId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

/**
 * Permite que un cliente actualice su propia sucursal desde el perfil.
 */
export async function actualizarMiSucursal(userId, sucursalId) {
    const { data, error } = await supabase
        .from('usuarios')
        .update({ sucursal_id: sucursalId })
        .eq('id', userId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
}
