// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Principal — Punto de entrada de la SPA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { router } from './enrutador.js';
import { inicializarSesion } from './modules/autenticacion/sesion.js';
import { obtenerUsuarioLocal, obtenerNombreRol } from './modules/autenticacion/authService.js';

// ── Renderizar layout base ──
const renderLayout = () => {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="app-container">
            <header class="header">
                <a href="#/home" class="header-logo">
                    Mecani-<span>koc</span>
                </a>
                <div class="header-nav" id="header-nav">
                    <div class="search-bar">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="global-search" placeholder="Buscar producto...">
                    </div>
                    <!-- Nav links se generan dinámicamente -->
                </div>
            </header>
            <main class="main-content" id="app-content">
            </main>
        </div>
    `;

    document.getElementById('global-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                window.location.hash = `#/inventario?q=${encodeURIComponent(query)}`;
            }
        }
    });
};

// ── Navegación dinámica según rol ──
const navConfigs = {
    guest: [
        { href: '#/inventario', icon: 'fa-solid fa-boxes-stacked', label: 'Inventario' },
        { href: '#/carrito',    icon: 'fa-solid fa-cart-shopping', label: 'Carrito', id: 'nav-cart' },
        { href: '#/login',     icon: 'fa-solid fa-circle-user',   label: 'Iniciar Sesión', id: 'nav-user' }
    ],
    cliente: [
        { href: '#/home',       icon: 'fa-solid fa-house',          label: 'Home' },
        { href: '#/inventario', icon: 'fa-solid fa-boxes-stacked',  label: 'Inventario' },
        { href: '#/carrito',    icon: 'fa-solid fa-cart-shopping',  label: 'Carrito', id: 'nav-cart' },
        { href: '#/perfil',     icon: 'fa-solid fa-circle-user',    label: 'Perfil', id: 'nav-user' }
    ],
    proveedor: [
        { href: '#/proveedor',  icon: 'fa-solid fa-gauge-high',     label: 'Dashboard' },
        { href: '#/inventario', icon: 'fa-solid fa-boxes-stacked',  label: 'Productos' },
        { href: '#/perfil',     icon: 'fa-solid fa-circle-user',    label: 'Perfil', id: 'nav-user' }
    ],
    admin: [
        { href: '#/admin',      icon: 'fa-solid fa-gauge-high',     label: 'Dashboard' },
        { href: '#/inventario', icon: 'fa-solid fa-boxes-stacked',  label: 'Productos' },
        { href: '#/carrito',    icon: 'fa-solid fa-cart-shopping',  label: 'Carrito', id: 'nav-cart' },
        { href: '#/perfil',     icon: 'fa-solid fa-circle-user',    label: 'Perfil', id: 'nav-user' }
    ]
};

export const updateNav = () => {
    const user = obtenerUsuarioLocal();
    const nav = document.getElementById('header-nav');
    if (!nav) return;

    // Conservar la barra de búsqueda
    const searchBar = nav.querySelector('.search-bar');
    const searchHTML = searchBar ? searchBar.outerHTML : '';

    // Determinar rol
    let rol = 'guest';
    if (user) {
        rol = obtenerNombreRol(user.rol_id);
    }

    const links = navConfigs[rol] || navConfigs.guest;

    // Obtener conteo del carrito de forma segura
    let cartCount = 0;
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cartCount = cart.reduce((acc, item) => acc + (item.cantidad || 0), 0);
    } catch {
        cartCount = 0;
    }

    let linksHTML = links.map(link => {
        let content = `<i class="${link.icon}"></i> ${link.label}`;

        // Si es el link de carrito, agregar badge
        if (link.id === 'nav-cart') {
            content = `<i class="${link.icon}"></i> Carrito <span class="cart-badge">${cartCount}</span>`;
        }

        // Si es el link de usuario y hay sesión, mostrar info del usuario
        if (link.id === 'nav-user' && user) {
            content = `
                <span style="display:flex; align-items:center; gap:0.5rem;">
                    <div class="avatar-circle">${user.nombre ? user.nombre.charAt(0).toUpperCase() : '👤'}</div>
                    ${user.nombre || 'Usuario'}
                    <span class="badge-zoles">${user.zoles ?? 0} Zoles</span>
                </span>
            `;
        }

        return `<a href="${link.href}" ${link.id ? `id="${link.id}"` : ''} class="nav-link">${content}</a>`;
    }).join('');

    nav.innerHTML = searchHTML + linksHTML;

    // Re-attach search listener
    const newSearch = document.getElementById('global-search');
    if (newSearch) {
        newSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.hash = `#/inventario?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
};

// ── Inicialización de la app ──
document.addEventListener('DOMContentLoaded', async () => {
    renderLayout();

    // Recuperar sesión de Supabase (async)
    try {
        await inicializarSesion();
    } catch (error) {
        console.warn("No se pudo recuperar sesión:", error);
    }

    updateNav();
    router();
});

// ── Eventos custom para reactividad ──
window.addEventListener('cart-updated', updateNav);
window.addEventListener('user-updated', updateNav);
window.addEventListener('hashchange', router);

console.log("✅ Principal cargado — Mecani-KOC");