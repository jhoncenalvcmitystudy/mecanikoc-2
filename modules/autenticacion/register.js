// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Registro — Renderizado + eventos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { registrarUsuario, guardarUsuarioLocal } from "./authService.js";

export const renderRegistro = (container) => {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-image"></div>
            <div class="auth-form-wrapper">
                <a href="#/home" style="color: var(--text-muted); margin-bottom: 1rem; display: inline-block;">← Volver al inicio</a>
                <h2>Crear Cuenta</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Únete a la mejor plataforma de mecánicos.</p>

                <div id="register-error" style="display:none; background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-size:0.9rem;"></div>
                <div id="register-success" style="display:none; background:#dcfce7; color:#16a34a; border:1px solid #bbf7d0; padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-size:0.9rem;"></div>

                <form id="register-form">
                    <div class="input-group">
                        <label>Nombre completo</label>
                        <input type="text" id="nombre" class="input-control" placeholder="Juan Pérez" required>
                    </div>
                    <div class="input-group">
                        <label>Correo electrónico</label>
                        <input type="email" id="email" class="input-control" placeholder="correo@ejemplo.com" required>
                    </div>
                    <div class="input-group">
                        <label>Contraseña</label>
                        <input type="password" id="password" class="input-control" placeholder="Mínimo 6 caracteres" minlength="6" required>
                    </div>
                    <button type="submit" class="btn btn-primary" id="btn-register" style="width:100%; margin-top: 1rem; padding: 1rem;">Registrarse</button>
                    <p style="margin-top: 2rem; text-align: center; color: var(--text-muted);">¿Ya tienes cuenta? <a href="#/login" style="color: var(--primary-color); font-weight: 600;">Inicia Sesión</a></p>
                </form>
            </div>
        </div>
    `;

    document.getElementById("register-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const btn = document.getElementById("btn-register");
        const errorBox = document.getElementById("register-error");
        const successBox = document.getElementById("register-success");

        errorBox.style.display = "none";
        successBox.style.display = "none";

        try {
            btn.disabled = true;
            btn.textContent = "Creando cuenta...";

            const user = await registrarUsuario(nombre, email, password);

            if (!user) {
                throw new Error("No se pudo registrar el usuario.");
            }

            guardarUsuarioLocal(user);

            successBox.textContent = "¡Cuenta creada exitosamente! Redirigiendo...";
            successBox.style.display = "block";

            window.dispatchEvent(new Event("user-updated"));

            setTimeout(() => {
                window.location.hash = "#/inventario";
            }, 1000);

        } catch (error) {
            errorBox.textContent = error.message || "Error al registrarse";
            errorBox.style.display = "block";
            btn.disabled = false;
            btn.textContent = "Registrarse";
        }
    });
};