// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Middleware: Rate Limiter
// Equivalente académico: RateLimiterFilter / Bucket4j (Spring)
//
// Implementa el algoritmo Token Bucket en el cliente
// usando localStorage para persistir el estado entre
// renders. Limita a MAX_LLAMADAS por ventana de tiempo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { log } from './logger.js';

/** Número máximo de llamadas permitidas en la ventana de tiempo. */
const MAX_LLAMADAS = 60;

/** Duración de la ventana de tiempo en milisegundos (1 minuto). */
const VENTANA_MS = 60_000;

/** Clave en localStorage donde se almacena el estado del rate limiter. */
const STORAGE_KEY = 'mkg_rate_limiter';

/**
 * Lee el estado del rate limiter desde localStorage.
 * @returns {{ count: number, windowStart: number }}
 */
function leerEstado() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { count: 0, windowStart: Date.now() };
        return JSON.parse(raw);
    } catch {
        return { count: 0, windowStart: Date.now() };
    }
}

/**
 * Guarda el estado del rate limiter en localStorage.
 * @param {{ count: number, windowStart: number }} estado
 */
function guardarEstado(estado) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

/**
 * Comprueba si el usuario supera el límite de llamadas.
 * Implementa la ventana deslizante: si han pasado más de
 * VENTANA_MS desde el inicio de la ventana, se reinicia.
 *
 * @param {string} userId - identificador del usuario (o 'anónimo')
 * @returns {{ permitido: boolean, restantes: number }}
 */
export function verificarLimite(userId) {
    const ahora = Date.now();
    const estado = leerEstado();

    // Si la ventana expiró, reiniciar
    if (ahora - estado.windowStart > VENTANA_MS) {
        const nuevoEstado = { count: 1, windowStart: ahora };
        guardarEstado(nuevoEstado);
        return { permitido: true, restantes: MAX_LLAMADAS - 1 };
    }

    if (estado.count >= MAX_LLAMADAS) {
        const esperaMs = VENTANA_MS - (ahora - estado.windowStart);
        return { permitido: false, restantes: 0, esperaMs };
    }

    estado.count++;
    guardarEstado(estado);
    return { permitido: true, restantes: MAX_LLAMADAS - estado.count };
}

/**
 * Middleware de rate limiting.
 * Corta la cadena si el usuario excedió el límite.
 *
 * @param {string}   endpoint
 * @param {object}   context
 * @param {Function} next
 * @returns {Promise<*>}
 */
export async function rateLimiterMiddleware(endpoint, context, next) {
    const userId = context.userId ?? 'anónimo';
    const { permitido, restantes, esperaMs } = verificarLimite(userId);

    if (!permitido) {
        const seg = Math.ceil((esperaMs ?? VENTANA_MS) / 1000);
        log('WARN', endpoint, {
            rate_limit: '🚫 EXCEDIDO',
            usuario: userId,
            espera_segundos: seg,
            limite: `${MAX_LLAMADAS} llamadas/${VENTANA_MS / 1000}s`
        });
        throw new Error(
            `Demasiadas solicitudes. Espera ${seg} segundo(s) antes de continuar.`
        );
    }

    log('DEBUG', endpoint, {
        rate_limit: '✅ OK',
        usuario: userId,
        restantes: `${restantes}/${MAX_LLAMADAS}`
    });

    return next();
}
