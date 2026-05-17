// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Registro — con selección de sucursal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { registrarUsuario, guardarUsuarioLocal } from './authService.js';
import { obtenerSucursales } from '../../services/sucursalesService.js';
import { errorState } from '../../ui/components.js';

export const renderRegistro = async (container) => {
    try {
        const html = await fetch('/templates/register.html').then(r => r.text());
        container.innerHTML = html;
    } catch {
        container.innerHTML = errorState('No se pudo cargar el formulario de registro.');
        return;
    }

    // Cargar sucursales en el select
    try {
        const sucursales = await obtenerSucursales();
        const select = document.getElementById('reg-sucursal');
        if (select) {
            select.innerHTML = '<option value="">— Selecciona tu sucursal —</option>'
                + sucursales.map(s =>
                    `<option value="${s.id}">${s.nombre} · ${s.ubicacion}</option>`
                ).join('');
        }
    } catch {
        console.warn('No se pudieron cargar sucursales para registro');
    }

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre     = document.getElementById('reg-nombre').value.trim();
        const email      = document.getElementById('reg-email').value.trim();
        const password   = document.getElementById('reg-password').value;
        const sucursalId = parseInt(document.getElementById('reg-sucursal').value) || null;
        const btn        = document.getElementById('btn-register');
        const errorBox   = document.getElementById('register-error');
        const successBox = document.getElementById('register-success');

        errorBox.style.display   = 'none';
        successBox.style.display = 'none';

        if (!sucursalId) {
            errorBox.textContent   = 'Selecciona una sucursal.';
            errorBox.style.display = 'block';
            return;
        }

        try {
            btn.disabled    = true;
            btn.textContent = 'Creando cuenta...';

            const user = await registrarUsuario(nombre, email, password, sucursalId);

            if (!user) throw new Error('No se pudo registrar el usuario.');

            guardarUsuarioLocal(user);

            successBox.textContent   = '¡Cuenta creada exitosamente! Redirigiendo...';
            successBox.style.display = 'block';

            window.dispatchEvent(new Event('user-updated'));

            setTimeout(() => {
                window.location.hash = '#/inventario';
            }, 1000);

        } catch (error) {
            errorBox.textContent   = error.message || 'Error al registrarse.';
            errorBox.style.display = 'block';
            btn.disabled    = false;
            btn.textContent = 'Registrarse';
        }
    });
};