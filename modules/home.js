// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Home — Página principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal, obtenerNombreRol } from './autenticacion/authService.js';
import { errorState } from '../ui/components.js';

export const renderHome = async (container) => {
    try {
        const html = await fetch('/templates/home.html').then(r => r.text());
        container.innerHTML = html;

        // Inyectar CTA dinámico según rol del usuario
        const user    = obtenerUsuarioLocal();
        const ctaEl   = document.getElementById('home-cta');
        if (!ctaEl) return;

        if (!user) {
            ctaEl.innerHTML = `
                <a href="#/inventario" class="btn btn-primary" style="padding: 0.9rem 2rem;">
                    <i class="fa-solid fa-boxes-stacked"></i> Ver Catálogo
                </a>
                <a href="#/login" class="btn btn-outline" style="padding: 0.9rem 2rem;">
                    <i class="fa-solid fa-circle-user"></i> Iniciar Sesión
                </a>
            `;
            return;
        }

        const rol = obtenerNombreRol(user.rol_id);
        const links = {
            admin:     { href: '#/admin',     label: 'Ir al Dashboard',  icon: 'fa-gauge-high' },
            proveedor: { href: '#/proveedor', label: 'Mi Panel',         icon: 'fa-gauge-high' },
            cliente:   { href: '#/inventario',label: 'Ver Catálogo',     icon: 'fa-boxes-stacked' },
        };
        const { href, label, icon } = links[rol] || links.cliente;

        ctaEl.innerHTML = `
            <a href="${href}" class="btn btn-primary" style="padding: 0.9rem 2rem;">
                <i class="fa-solid ${icon}"></i> ${label}
            </a>
        `;

    } catch (error) {
        container.innerHTML = errorState(error.message);
    }
};
