// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Middleware: Auth Middleware
// Equivalente académico: JwtAuthenticationFilter (Spring Security)
//
// Valida que el usuario tiene una sesión activa en
// Supabase antes de permitir llamadas a endpoints
// protegidos. Devuelve el userId para que los siguientes
// middlewares (rate limiter, logger) puedan identificar
// al usuario en sus registros.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from '../supabaseClient.js';
import { log } from './logger.js';

/**
 * Lista de endpoints que NO requieren autenticación
 * (equivalente a `.permitAll()` en Spring Security).
 *
 * Convención de nombres de endpoint: 'tabla:operacion'
 */
const ENDPOINTS_PUBLICOS = [
    'sucursales:select',
    'productos:select',
    'inventario:select',
    'categorias:select',
    'proveedores:select',
];

/**
 * Verifica si un endpoint es público.
 * @param {string} endpoint
 * @returns {boolean}
 */
function esPublico(endpoint) {
    return ENDPOINTS_PUBLICOS.some(pub => endpoint.startsWith(pub));
}

/**
 * Middleware de autenticación.
 *
 * - Si el endpoint es público → pasa sin validar.
 * - Si el endpoint es protegido → verifica sesión Supabase.
 *   • Sesión válida  → inyecta `context.userId` y continúa.
 *   • Sin sesión     → lanza error 401.
 *
 * @param {string}   endpoint
 * @param {object}   context   - contexto mutable del pipeline
 * @param {Function} next
 * @returns {Promise<*>}
 */
export async function authMiddleware(endpoint, context, next) {
    if (esPublico(endpoint)) {
        log('DEBUG', endpoint, { auth: '🔓 Endpoint público, sin validación' });
        return next();
    }

    // Obtener sesión activa desde Supabase Auth
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session || !session.user) {
        log('WARN', endpoint, { auth: '🚫 Sin sesión activa — acceso denegado' });
        throw new Error('[Auth] No tienes una sesión activa. Inicia sesión para continuar.');
    }

    // Inyectar userId en el contexto para que otros middlewares lo usen
    context.userId = session.user.id;

    log('DEBUG', endpoint, {
        auth: '✅ Sesión válida',
        uid: session.user.id,
        email: session.user.email
    });

    return next();
}
