// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Login — Renderizado + eventos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { iniciarSesion, guardarUsuarioLocal } from "./authService.js";

export const renderLogin = (container) => {

    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-image"></div>
            <div class="auth-form-wrapper">
                <a href="#/home" style="color: var(--text-muted); margin-bottom: 2rem; display: inline-block;">← Volver al inicio</a>
                <h2>Iniciar Sesión</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Ingresa tus credenciales para continuar.</p>

                <div id="login-error" style="display:none; background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-size:0.9rem;"></div>

                <form id="login-form">
                    <div class="input-group">
                        <label>Correo electrónico</label>
                        <input type="email" id="email" class="input-control" placeholder="correo@ejemplo.com" required>
                    </div>
                    <div class="input-group">
                        <label>Contraseña</label>
                        <input type="password" id="password" class="input-control" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" id="btn-login" style="width:100%; margin-top: 1rem; padding: 1rem;">Ingresar</button>
                    <p style="margin-top: 2rem; text-align: center; color: var(--text-muted);">¿No tienes cuenta? <a href="#/registro" style="color: var(--primary-color); font-weight: 600;">Regístrate</a></p>
                </form>
            </div>
        </div>
    `;

    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const btn = document.getElementById("btn-login");
        const errorBox = document.getElementById("login-error");

        errorBox.style.display = "none";

        try {
            btn.disabled = true;
            btn.textContent = "Verificando...";

            const user = await iniciarSesion(email, password);
            guardarUsuarioLocal(user);

            window.dispatchEvent(new Event("user-updated"));
            window.location.hash = "#/inventario";

        } catch (error) {
            errorBox.textContent = error.message || "Error al iniciar sesión";
            errorBox.style.display = "block";
            btn.disabled = false;
            btn.textContent = "Ingresar";
        }
    });
};