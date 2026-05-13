import { renderHome } from './modules/home.js';
import { renderLogin } from './modules/autenticacion/login.js';
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

console.log("router funcionando");
export const router = () => {

    let hash =
        window.location.hash ||
        '#/home';

    let path = hash;

    let query = '';

    if (hash.includes('?')) {

        [path, query] =
            hash.split('?');

    }

    const currentUser =
    JSON.parse(
        localStorage.getItem(
            "currentUser"
        ) || "null"
    );

    if (
        !currentUser &&
        path === "#/perfil"
    ) {

        window.location.hash =
            "#/login";

        return;

    }

    const renderFunction =
        routes[path] ||
        renderHome;

    const appContent =
        document.getElementById(
            'app-content'
        );

    if (appContent) {

        appContent.innerHTML = '';

        renderFunction(
            appContent,
            query
        );

    }

};