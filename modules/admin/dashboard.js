import { supabase } from "../../core/supabaseClient.js";
import { obtenerUsuarioLocal } from "../autenticacion/authService.js";

import "./dashboardAdmin.css";

export const renderDashboardAdmin = async (container) => {

    const user = obtenerUsuarioLocal();

    if (!user || user.rol_id !== 2) {
        window.location.hash = "#/home";
        return;
    }

    // Loading
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Cargando dashboard...</p>
        </div>
    `;

    try {

        // Cargar HTML template
        const response = await fetch("/src/modules/dashboard/dashboardAdmin.html");
        const html = await response.text();

        container.innerHTML = html;

        // Referencias DOM
        const bienvenida = document.getElementById("admin-bienvenida");

        const statUsuarios = document.getElementById("stat-usuarios");
        const statProductos = document.getElementById("stat-productos");
        const statPedidos = document.getElementById("stat-pedidos");
        const statVentas = document.getElementById("stat-ventas");

        const tabContent = document.getElementById("admin-tab-content");

        // Queries
        const [
            { data: usuarios },
            { data: productos },
            { data: pedidos }
        ] = await Promise.all([
            supabase.from("usuarios").select("*"),
            supabase.from("productos").select("*"),
            supabase.from("pedidos").select("*")
        ]);

        // Stats
        const totalVentas = (pedidos || [])
            .reduce((a, p) => a + (p.total || 0), 0);

        bienvenida.textContent =
            `Bienvenido, ${user.nombre}`;

        statUsuarios.textContent = usuarios.length;
        statProductos.textContent = productos.length;
        statPedidos.textContent = pedidos.length;
        statVentas.textContent = `$ ${totalVentas}`;

        // Tabs
        const renderUsuarios = () => {

            tabContent.innerHTML = `
                <table class="table-admin">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${usuarios.map(u => `
                            <tr>
                                <td>${u.id}</td>
                                <td>${u.nombre}</td>
                                <td>${u.email}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        };

        // Render inicial
        renderUsuarios();

        // Tabs listeners
        document.querySelectorAll(".admin-tab")
            .forEach(tab => {

                tab.addEventListener("click", (e) => {

                    document.querySelectorAll(".admin-tab")
                        .forEach(t => t.classList.remove("active"));

                    e.currentTarget.classList.add("active");

                    const tabName = e.currentTarget.dataset.tab;

                    switch (tabName) {

                        case "usuarios":
                            renderUsuarios();
                            break;

                        case "pedidos":
                            tabContent.innerHTML = "<h2>Pedidos</h2>";
                            break;

                        case "productos":
                            tabContent.innerHTML = "<h2>Productos</h2>";
                            break;
                    }
                });
            });

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                <h2>Error cargando dashboard</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
};