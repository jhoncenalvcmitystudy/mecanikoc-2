import { iniciarSesion }
from "./authService.js";

export const renderLogin = (
    container
) => {

    container.innerHTML = `

        <div class="auth-container">

            <div class="auth-image"></div>

            <div class="auth-form-wrapper">

                <a
                    href="#/home"
                    style="
                        color: var(--text-muted);
                        margin-bottom: 2rem;
                        display: inline-block;
                    "
                >
                    ← Volver al inicio
                </a>

                <h2>Iniciar Sesión</h2>

                <p
                    style="
                        color: var(--text-muted);
                        margin-bottom: 2rem;
                    "
                >
                    Ingresa tus credenciales
                    para continuar.
                </p>

                <form id="login-form">

                    <div class="input-group">

                        <label>
                            Correo electrónico
                        </label>

                        <input
                            type="email"
                            id="email"
                            class="input-control"
                            required
                        >

                    </div>

                    <div class="input-group">

                        <label>
                            Contraseña
                        </label>

                        <input
                            type="password"
                            id="password"
                            class="input-control"
                            required
                        >

                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary"
                        id="btn-login"
                        style="
                            width:100%;
                            margin-top:1rem;
                            padding:1rem;
                        "
                    >
                        Ingresar
                    </button>

                </form>

            </div>

        </div>

    `;

    document
    .getElementById("login-form")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const email =
                document.getElementById(
                    "email"
                ).value;

            const password =
                document.getElementById(
                    "password"
                ).value;

            const btn =
                document.getElementById(
                    "btn-login"
                );

            try {

                btn.disabled = true;

                btn.textContent =
                    "Verificando...";

                const user =
                    await iniciarSesion(
                        email,
                        password
                    );

                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(user)
                );

                window.dispatchEvent(
                    new Event(
                        "user-updated"
                    )
                );

                alert("Login correcto");

                window.location.hash =
                    "#/inventario";

            }

            catch(error) {

                alert(error.message);

                btn.disabled = false;

                btn.textContent =
                    "Ingresar";

            }

        }
    );

};