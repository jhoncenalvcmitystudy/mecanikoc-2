// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Middleware: CORS Guard
// Equivalente académico: CorsFilter de Spring Security
//
// En una SPA en el cliente no existe un "origen" de
// request como en el servidor, pero simulamos la
// validación de origen para demostrar el patrón
// arquitectónico. En producción, este filtro vive en
// el API Gateway del servidor.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { log } from './logger.js';

/**
 * Orígenes permitidos (whitelist).
 * En Vercel la app se sirve desde el mismo dominio,
 * por lo que `window.location.origin` siempre estará aquí.
 * En desarrollo local también se permite localhost.
 */
const ORIGENES_PERMITIDOS = [
    window.location.origin,                 // dominio actual (Vercel / prod)
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://127.0.0.1',
];

/**
 * Determina el origen efectivo de la solicitud.
 * En el cliente, el "origen" es simplemente el de la ventana actual.
 */
function obtenerOrigen() {
    return window.location.origin;
}

/**
 * Middleware de validación de origen (CORS Guard).
 * Rechaza llamadas cuyo origen no esté en la whitelist.
 * Demuestra el patrón CorsFilter de Spring.
 *
 * @param {string}   endpoint
 * @param {object}   context
 * @param {Function} next
 * @returns {Promise<*>}
 */
export async function corsGuardMiddleware(endpoint, context, next) {
    const origen = obtenerOrigen();
    const permitido = ORIGENES_PERMITIDOS.some(o => origen.startsWith(o));

    if (!permitido) {
        log('WARN', endpoint, {
            cors: '🚫 BLOQUEADO',
            origen,
            permitidos: ORIGENES_PERMITIDOS.join(', ')
        });
        throw new Error(`[CORS] Origen no permitido: ${origen}`);
    }

    log('DEBUG', endpoint, { cors: '✅ Origen aceptado', origen });
    return next();
}
