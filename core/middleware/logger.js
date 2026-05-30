// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Middleware: Logger
// Equivalente académico: LoggingFilter / Spring Actuator
//
// Registra en consola cada llamada que pasa por el
// API Gateway con: timestamp, nivel, endpoint y resultado.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const NIVELES = {
    INFO:  { label: 'INFO ', color: '#3b82f6' },
    WARN:  { label: 'WARN ', color: '#f59e0b' },
    ERROR: { label: 'ERROR', color: '#ef4444' },
    DEBUG: { label: 'DEBUG', color: '#8b5cf6' },
};

/**
 * Imprime una línea de log con formato estructurado.
 * @param {'INFO'|'WARN'|'ERROR'|'DEBUG'} nivel
 * @param {string} endpoint   - nombre del endpoint (ej: 'pedidos:select')
 * @param {object} [meta={}]  - metadatos adicionales
 */
export function log(nivel, endpoint, meta = {}) {
    const { label, color } = NIVELES[nivel] ?? NIVELES.INFO;
    const ts = new Date().toISOString();
    const prefix = `%c[MecaniGW] ${label} %c${ts}`;

    console.groupCollapsed(
        `${prefix} %c→ ${endpoint}`,
        `color:${color}; font-weight:700`,
        'color:#6b7280; font-size:0.85em',
        'color:#1f2937; font-weight:600'
    );

    if (Object.keys(meta).length > 0) {
        console.table(
            Object.fromEntries(
                Object.entries(meta).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v])
            )
        );
    }

    console.groupEnd();
}

/**
 * Middleware de logging.
 * Mide el tiempo de ejecución de la cadena siguiente
 * y registra éxito o error.
 *
 * @param {string}   endpoint
 * @param {object}   context   - contexto compartido del pipeline
 * @param {Function} next      - siguiente middleware en la cadena
 * @returns {Promise<*>}
 */
export async function loggerMiddleware(endpoint, context, next) {
    const inicio = performance.now();

    log('INFO', endpoint, { usuario: context.userId ?? 'anónimo', opciones: context.options });

    try {
        const resultado = await next();
        const ms = (performance.now() - inicio).toFixed(1);
        log('INFO', endpoint, { estado: '✅ OK', tiempo_ms: ms });
        return resultado;
    } catch (err) {
        const ms = (performance.now() - inicio).toFixed(1);
        log('ERROR', endpoint, { estado: '❌ ERROR', mensaje: err.message, tiempo_ms: ms });
        throw err;
    }
}
