import { fakeApi } from '../../core/fakeApi.js';

export const renderLogin = (container) => {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-image"></div>
            <div class="auth-form-wrapper">
                <a href="#/home" style="color: var(--text-muted); margin-bottom: 2rem; display: inline-block;">← Volver al inicio</a>
                <h2>Iniciar Sesión</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Ingresa tus credenciales para continuar.</p>
                
                <form id="login-form">
                    <div class="input-group">
                        <label>Correo electrónico</label>
                        <input type="email" id="email" class="input-control" placeholder="admin@mecanikoc.com" required>
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

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btn-login');
        
        try {
            btn.disabled = true;
            btn.textContent = 'Verificando...';
            const user = await fakeApi.loginUsuario(email, password);
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.dispatchEvent(new Event('user-updated'));
            window.location.hash = '#/inventario';
        } catch (error) {
            alert(error.message);
            btn.disabled = false;
            btn.textContent = 'Ingresar';
        }
    });
};

export const renderRegistro = (container) => {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-image"></div>
            <div class="auth-form-wrapper">
                <a href="#/home" style="color: var(--text-muted); margin-bottom: 1rem; display: inline-block;">← Volver al inicio</a>
                <h2>Crear Cuenta</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Únete a la mejor plataforma de mecánicos.</p>
                
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
                        <input type="password" id="password" class="input-control" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" id="btn-register" style="width:100%; margin-top: 1rem; padding: 1rem;">Registrarse</button>
                    <p style="margin-top: 2rem; text-align: center; color: var(--text-muted);">¿Ya tienes cuenta? <a href="#/login" style="color: var(--primary-color); font-weight: 600;">Inicia Sesión</a></p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btn-register');
        
        try {
            btn.disabled = true;
            btn.textContent = 'Creando cuenta...';
            const user = await fakeApi.registrarUsuario(nombre, email, password);
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.dispatchEvent(new Event('user-updated'));
            window.location.hash = '#/inventario';
        } catch (error) {
            alert(error.message);
            btn.disabled = false;
            btn.textContent = 'Registrarse';
        }
    });
};
