// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Servicio de Usuario — Queries Supabase
// Enrutado a través de la capa de Middleware (API Gateway)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from '../core/supabaseClient.js';
import { apiCall }  from '../core/middleware/index.js';

/**
 * Obtiene todos los pedidos de un usuario ordenados por más reciente.
 * Incluye nombre de la sucursal de cada pedido.
 */
export async function obtenerPedidosDeUsuario(userId) {
    const data = await apiCall('pedidos:select', {
        select: '*, sucursales(nombre, ubicacion)',
        filter: { usuario_id: userId },
        order: 'id',
        ascending: false
    });
    return data || [];
}

/**
 * Obtiene los últimos movimientos de Soles de un usuario.
 */
export async function obtenerMovimientosSoles(userId, limit = 10) {
    const data = await apiCall('movimientos_soles:select', {
        select: '*',
        filter: { usuario_id: userId },
        order: 'id',
        ascending: false,
        limit
    });
    return data || [];
}

/**
 * Obtiene todos los usuarios con su sucursal asignada (solo para admin).
 */
export async function obtenerTodosLosUsuarios() {
    const data = await apiCall('usuarios:select', {
        select: '*, sucursales(nombre, ubicacion)',
        order: 'id',
        ascending: true
    });
    return data || [];
}

/**
 * Obtiene todos los pedidos con sucursal (solo para admin).
 */
export async function obtenerTodosLosPedidos() {
    const data = await apiCall('pedidos:select', {
        select: '*, sucursales(nombre, ubicacion)',
        order: 'id',
        ascending: false
    });
    return data || [];
}

/**
 * Asigna una sucursal a un usuario (solo admin puede llamar esto).
 * Para clientes: su sucursal preferida de compra.
 * Para admin/proveedor: su sede de trabajo.
 * Pasa null para desasignar.
 */
export async function asignarSucursalAUsuario(userId, sucursalId) {
    const data = await apiCall('usuarios:update', {
        data: { sucursal_id: sucursalId },
        filter: { id: userId },
        single: true
    });
    return data;
}

/**
 * Permite que un cliente actualice su propia sucursal desde el perfil.
 */
export async function actualizarMiSucursal(userId, sucursalId) {
    const data = await apiCall('usuarios:update', {
        data: { sucursal_id: sucursalId },
        filter: { id: userId },
        single: true
    });
    return data;
}
