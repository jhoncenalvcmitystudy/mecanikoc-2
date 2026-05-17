// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Login — Carga template + eventos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { iniciarSesion, guardarUsuarioLocal } from './authService.js';
import { errorState } from '../../ui/components.js';

export const renderLogin = async (container) => {
    try {
        const html = await fetch('/templates/login.html').then(r => r.text());
        container.innerHTML = html;
    } catch {
        container.innerHTML = errorState('No se pudo cargar el formulario de inicio de sesión.');
        return;
    }

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn      = document.getElementById('btn-login');
        const errorBox = document.getElementById('login-error');

        errorBox.style.display = 'none';

        try {
            btn.disabled    = true;
            btn.textContent = 'Verificando...';

            const user = await iniciarSesion(email, password);
            guardarUsuarioLocal(user);

            window.dispatchEvent(new Event('user-updated'));
            window.location.hash = '#/inventario';

        } catch (error) {
            errorBox.textContent   = error.message || 'Error al iniciar sesión.';
            errorBox.style.display = 'block';
            btn.disabled    = false;
            btn.textContent = 'Ingresar';
        }
    });
};