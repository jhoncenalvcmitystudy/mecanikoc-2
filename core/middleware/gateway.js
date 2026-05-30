// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Gateway — Orquestador del Pipeline de Middlewares
// Equivalente académico: DispatcherServlet + FilterChain
//                        de Spring Boot / Spring Security
//
// Implementa el patrón Chain of Responsibility:
//   corsGuard → logger → rateLimiter → auth → supabaseAdapter
//
// Cada middleware recibe (endpoint, context, next) y
// puede interrumpir la cadena lanzando un error, o
// continuar llamando a next().
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase }              from '../supabaseClient.js';
import { corsGuardMiddleware }   from './corsGuard.js';
import { loggerMiddleware }      from './logger.js';
import { rateLimiterMiddleware } from './rateLimiter.js';
import { authMiddleware }        from './authMiddleware.js';

// ── Supabase Adapter ─────────────────────────────────
// Traduce el "endpoint" del gateway (ej: 'pedidos:select')
// en una query real de Supabase. Es la capa más interna
// del pipeline, equivalente al Repository/DAO en Spring.
// ─────────────────────────────────────────────────────

/**
 * Ejecuta una query Supabase a partir del nombre del endpoint
 * y las opciones pasadas al gateway.
 *
 * Convenios de nombre de endpoint:
 *   'tabla:select'  → supabase.from(tabla).select(...)
 *   'tabla:insert'  → supabase.from(tabla).insert(...)
 *   'tabla:update'  → supabase.from(tabla).update(...)
 *   'tabla:delete'  → supabase.from(tabla).delete(...)
 *   'tabla:upsert'  → supabase.from(tabla).upsert(...)
 *   'auth:session'  → supabase.auth.getSession()
 *
 * @param {string} endpoint  - 'tabla:operacion'
 * @param {object} options   - opciones de la query
 * @returns {Promise<*>}
 */
async function supabaseAdapter(endpoint, options = {}) {
    // ── Endpoints especiales de Auth ──────────────────
    if (endpoint === 'auth:session') {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    // ── Endpoints de tabla ────────────────────────────
    const [tabla, operacion] = endpoint.split(':');

    if (!tabla || !operacion) {
        throw new Error(`[Gateway] Endpoint inválido: "${endpoint}". Usa el formato "tabla:operacion".`);
    }

    const {
        select    = '*',
        data      = null,
        filter    = {},
        eq        = null,
        single    = false,
        limit     = null,
        order     = null,
        ascending = false,
    } = options;

    let query = supabase.from(tabla);

    switch (operacion) {
        case 'select':
            query = query.select(select);
            break;
        case 'insert':
            if (!data) throw new Error('[Gateway] "data" requerido para insert.');
            query = query.insert(Array.isArray(data) ? data : [data]).select(select);
            break;
        case 'update':
            if (!data) throw new Error('[Gateway] "data" requerido para update.');
            query = query.update(data).select(select);
            break;
        case 'upsert':
            if (!data) throw new Error('[Gateway] "data" requerido para upsert.');
            query = query.upsert(Array.isArray(data) ? data : [data]).select(select);
            break;
        case 'delete':
            query = query.delete();
            break;
        default:
            throw new Error(`[Gateway] Operación desconocida: "${operacion}".`);
    }

    // ── Filtros ───────────────────────────────────────
    // Filtro genérico de igualdad desde el objeto `filter`
    for (const [col, val] of Object.entries(filter)) {
        query = query.eq(col, val);
    }

    // Filtro eq atajo (para compatibilidad simple)
    if (eq) {
        const [col, val] = Object.entries(eq)[0];
        query = query.eq(col, val);
    }

    // ── Modificadores ────────────────────────────────
    if (order) {
        query = query.order(order, { ascending });
    }
    if (limit !== null) {
        query = query.limit(limit);
    }
    if (single) {
        query = query.single();
    }

    const { data: result, error } = await query;
    if (error) throw error;
    return result;
}

// ── Cadena de middlewares ──────────────────────────────
// Orden: corsGuard → logger → rateLimiter → auth → adapter
// Análogo al orden de FilterChain en Spring Security.
// ──────────────────────────────────────────────────────

const pipeline = [
    corsGuardMiddleware,
    loggerMiddleware,
    rateLimiterMiddleware,
    authMiddleware,
];

/**
 * Ejecuta el pipeline completo de middlewares para un endpoint.
 *
 * Patrón: Chain of Responsibility.
 * Cada middleware llama a `next()` para ceder el control
 * al siguiente, o lanza un error para interrumpir la cadena.
 *
 * @param {string} endpoint   - 'tabla:operacion'
 * @param {object} [options]  - opciones de la query
 * @returns {Promise<*>}
 */
export async function ejecutarPipeline(endpoint, options = {}) {
    // Contexto compartido mutable entre middlewares
    // (equivale al SecurityContext / RequestContext de Spring)
    const context = { options, userId: null };

    let index = 0;

    const next = async () => {
        if (index < pipeline.length) {
            const middleware = pipeline[index++];
            return middleware(endpoint, context, next);
        }
        // Fin de la cadena: ejecutar el adaptador de Supabase
        return supabaseAdapter(endpoint, options);
    };

    return next();
}
