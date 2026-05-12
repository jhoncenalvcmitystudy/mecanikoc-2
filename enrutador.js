import { renderHome } from './modules/home.js';
import { renderLogin } from './modules/autenticacion/auth.js';
import { renderInventario } from './modules/productos/inventario.js';
import { renderRegistro} from './modules/autenticacion/register.js';
import { renderCarrito } from './modules/carrito/carrito.js';
import { renderPerfil } from './modules/usuario/perfil.js';

const routes = {
    '': renderHome,
    '#/home': renderHome,
    '#/login': renderLogin,
    '#/registro': renderRegistro,
    '#/inventario': renderInventario,
    '#/carrito': renderCarrito,
    '#/perfil': renderPerfil
};

export const router = () => {
    // Manejar parámetros en la URL (ej. #/inventario?q=llave)
    let hash = window.location.hash || '#/home';
    let path = hash;
    let query = '';
    
    if (hash.includes('?')) {
        [path, query] = hash.split('?');
    }

    const renderFunction = routes[path] || renderHome;
    
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = '';
        appContent.style.opacity = 0;
        
        setTimeout(() => {
            renderFunction(appContent, query);
            appContent.style.transition = 'opacity 0.3s ease';
            appContent.style.opacity = 1;
            
            // Scroll to top on route change
            window.scrollTo(0, 0);
        }, 50);
    }
};

window.addEventListener('hashchange', router);
