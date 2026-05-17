// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Componentes UI — Funciones de HTML reutilizables
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Genera el HTML de un spinner de carga centrado.
 * @param {string} mensaje - Texto bajo el spinner.
 */
export const spinner = (mensaje = 'Cargando...') => `
    <div style="text-align: center; padding: 4rem;">
        <div class="ui-spinner"></div>
        <p style="margin-top: 1rem; color: var(--text-muted);">${mensaje}</p>
    </div>
`;

/**
 * Genera el HTML de un estado vacío con icono, título y acción opcional.
 * @param {object} opts
 * @param {string} opts.icon        - Emoji o icono.
 * @param {string} opts.title       - Título del estado vacío.
 * @param {string} opts.message     - Descripción.
 * @param {string} [opts.actionHref]  - URL del botón de acción.
 * @param {string} [opts.actionLabel] - Texto del botón de acción.
 */
export const emptyState = ({ icon = '📦', title, message, actionHref, actionLabel }) => `
    <div style="text-align: center; padding: 6rem 2rem; background: var(--card-bg);
        border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
        max-width: 600px; margin: 4rem auto;">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">${icon}</div>
        <h2 style="font-size: 2rem; margin-bottom: 1rem;">${title}</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">${message}</p>
        ${actionHref
            ? `<a href="${actionHref}" class="btn btn-primary"
                style="padding: 1rem 3rem; font-size: 1.1rem;">${actionLabel}</a>`
            : ''}
    </div>
`;

/**
 * Genera el HTML de un estado de error.
 * @param {string} mensaje - Descripción del error.
 */
export const errorState = (mensaje = 'Ocurrió un error inesperado.') => `
    <div style="text-align: center; padding: 4rem; color: #ef4444;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2>Error al cargar</h2>
        <p style="margin-top: 0.5rem; color: var(--text-muted);">${mensaje}</p>
        <button class="btn btn-primary" style="margin-top: 1.5rem;"
            onclick="location.reload()">Reintentar</button>
    </div>
`;

/**
 * Genera el HTML de una fila de estado de badge (completado/pendiente/cancelado).
 * @param {string} estado - 'completado' | 'pendiente' | cualquier otro.
 */
export const estadoBadge = (estado) => {
    const colores = {
        completado: { bg: '#dcfce7', color: '#16a34a' },
        pendiente:  { bg: '#fef3c7', color: '#d97706' },
    };
    const { bg, color } = colores[estado] || { bg: '#fee2e2', color: '#ef4444' };
    return `<span style="background: ${bg}; color: ${color}; padding: 0.3rem 0.8rem;
        border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600;
        display: inline-flex; align-items: center; gap: 0.25rem;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
        ${estado}
    </span>`;
};
