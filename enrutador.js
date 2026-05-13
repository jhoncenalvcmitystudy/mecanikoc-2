// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Enrutador — Hash routing SPA con protección de rutas
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { renderHome } from './modules/home.js';
import { renderLogin } from './modules/autenticacion/login.js';
import { renderRegistro } from './modules/autenticacion/register.js';
import { renderInventario } from './modules/productos/inventario.js';
import { renderCarrito } from './modules/carrito/carrito.js';
import { renderPerfil } from './modules/usuario/perfil.js';
import { renderDashboardAdmin } from './modules/admin/dashboard.js';
import { renderDashboardProveedor } from './modules/proveedor/dashboard.js';
import { obtenerUsuarioLocal, obtenerNombreRol } from './modules/autenticacion/authService.js';

// ── Definición de rutas ──
const routes = {
    '':                    renderHome,
    '#/home':              renderHome,
    '#/login':             renderLogin,
    '#/registro':          renderRegistro,
    '#/inventario':        renderInventario,
    '#/carrito':           renderCarrito,
    '#/perfil':            renderPerfil,
    '#/admin':             renderDashboardAdmin,
    '#/proveedor':         renderDashboardProveedor
};

// ── Rutas protegidas (requieren autenticación) ──
const rutasProtegidas = ['#/perfil', '#/carrito', '#/admin', '#/proveedor'];

// ── Rutas por rol ──
const rutasPorRol = {
    '#/admin':     [2],        // solo admin
    '#/proveedor': [2, 3]      // admin y proveedor
};

export const router = () => {
    let hash = window.location.hash || '#/home';
    let path = hash;
    let query = '';

    if (hash.includes('?')) {
        [path, query] = hash.split('?');
    }

    const currentUser = obtenerUsuarioLocal();

    // ── Protección de rutas: redirigir a login si no hay usuario ──
    if (!currentUser && rutasProtegidas.includes(path)) {
        window.location.hash = '#/login';
        return;
    }

    // ── Protección por rol ──
    if (currentUser && rutasPorRol[path]) {
        const rolesPermitidos = rutasPorRol[path];
        if (!rolesPermitidos.includes(currentUser.rol_id)) {
            window.location.hash = '#/home';
            return;
        }
    }

    const renderFunction = routes[path] || renderHome;

    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = '';
        renderFunction(appContent, query);
    }
};

console.log("✅ Enrutador configurado");