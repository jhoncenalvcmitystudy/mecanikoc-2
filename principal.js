import { router } from './enrutador.js';

const renderLayout = () => {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="app-container">
            <header class="header">
                <a href="#/home" class="header-logo">
                    Mecani-<span>koc</span>
                </a>
                <div class="header-nav">
                    <div class="search-bar">
                    
                        <span style="color: var(--text-muted)"></span>
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="global-search" placeholder="Buscar producto...">
                    </div>
                    <a href="#/inventario" class="nav-link">Inventario</a>
                    <a href="#/carrito" id="nav-cart" class="nav-link"> Carrito (0)</a>
                    <a href="#/login" id="nav-user" class="nav-link"><i class="fa-solid fa-circle-user"></i> Login</a>
                </div>
            </header>
            <main class="main-content" id="app-content">
            </main>
        </div>
    `;

    document.getElementById('global-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value;
            window.location.hash = `#/inventario?q=${encodeURIComponent(query)}`;
        }
    });
};

export const updateNav = () => {
    const user = JSON.parse(
    localStorage.getItem('currentUser')
    || 'null'
);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const navUser = document.getElementById('nav-user');
    const navCart = document.getElementById('nav-cart');
    
    if (navUser) {
        if (user) {
            navUser.innerHTML = `<span style="display:flex; align-items:center; gap:0.5rem;"><div class="avatar-circle">👤</div> ${user.nombre} <span class="badge-zoles">${user.zoles} Zoles</span></span>`;
            navUser.href = '#/perfil';
        } else {
            navUser.innerHTML = `<i class="fa-solid fa-circle-user"></i> Iniciar Sesión`;
            navUser.href = '#/login';
        }
    }
    
    if (navCart) {
        const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
        navCart.innerHTML = `<i class="fa-solid fa-cart-shopping"></i>  Carrito <span class="cart-badge">${cartCount}</span>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    renderLayout();
    updateNav();
    router();
});

// Eventos personalizados para actualizar la barra de navegación dinámicamente
window.addEventListener('cart-updated', updateNav);
window.addEventListener('user-updated', updateNav);



const currentUser =
JSON.parse(
    localStorage.getItem(
        "currentUser"
    ) || "null"
);

console.log(currentUser);

window.addEventListener(
    "hashchange",
    router
);