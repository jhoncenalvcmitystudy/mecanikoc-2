// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Home — Página principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal, obtenerNombreRol } from "./autenticacion/authService.js";

export const renderHome = (container) => {
    const user = obtenerUsuarioLocal();

    // Determinar CTA según estado de sesión
    let ctaHTML = `
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            
        </div>
    `;

    if (user) {
        const rol = obtenerNombreRol(user.rol_id);
        let dashboardLink = '#/inventario';
        let dashboardLabel = 'Ver Catálogo';

        if (rol === 'admin') {
            dashboardLink = '#/admin';
            dashboardLabel = 'Ir al Dashboard';
        } else if (rol === 'proveedor') {
            dashboardLink = '#/proveedor';
            dashboardLabel = 'Mi Panel';
        }

        
    }

    container.innerHTML = `
        <div class="hero">
            <div class="hero-content">
                <h1>Mecani-<span>koc</span></h1>
                <p>La mejor plataforma nacional para comprar sus herramientas mecánicas, sé parte del cambio, sé un mecánico preparado.</p>
                ${ctaHTML}
            </div>
            <div class="hero-image-placeholder"></div>
        </div>

        <div>
            <h2 style="color: var(--text-main); margin-bottom: 4rem; font-size: 2rem; text-align: center;">Sobre nosotros</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
                <div style="padding: 40px; min-height: 200px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-muted); gap: 1rem; transition: var(--transition);">
                    <div style="font-size: 2.5rem;">🔧</div>
                    <strong style="color: var(--text-main); font-size: 1.1rem;">Calidad Garantizada</strong>
                    <p>En cada producto que ofrecemos, la excelencia es nuestra prioridad. Trabajamos con proveedores confiables y materiales de primera para asegurar que cada artículo cumpla con los más altos estándares de calidad.</p>
                </div>
                <div style="padding: 40px; min-height: 200px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-muted); gap: 1rem; transition: var(--transition);">
                    <div style="font-size: 2.5rem;">🚚</div>
                    <strong style="color: var(--text-main); font-size: 1.1rem;">Envío Rápido</strong>
                    <p>Sabemos que el tiempo es esencial en el mundo de la mecánica. Por eso, contamos con un sistema de logística eficiente que asegura entregas rápidas a nivel nacional.</p>
                </div>
                <div style="padding: 40px; min-height: 200px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-muted); gap: 1rem; transition: var(--transition);">
                    <div style="font-size: 2.5rem;">📞</div>
                    <strong style="color: var(--text-main); font-size: 1.1rem;">Soporte 24/7</strong>
                    <p>Nunca estarás solo. Nuestro equipo de atención al cliente está disponible las 24 horas, los 7 días de la semana, para resolver tus dudas y ayudarte en cada paso.</p>
                </div>
            </div>
        </div>
    `;
};
