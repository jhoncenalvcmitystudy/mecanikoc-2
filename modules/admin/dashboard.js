// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dashboard Admin — Panel de administración (Supabase)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from "../../core/supabaseClient.js";
import { obtenerUsuarioLocal } from "../autenticacion/authService.js";

export const renderDashboardAdmin = async (container) => {
    const user = obtenerUsuarioLocal();
    if (!user || user.rol_id !== 2) {
        window.location.hash = "#/home";
        return;
    }

    container.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">Cargando dashboard...</p>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    try {
        // Fetch all dashboard data
        const [
            { data: usuarios },
            { data: productos },
            { data: pedidos },
            { data: categorias },
            { data: proveedores },
            { data: movInv },
            { data: movZoles }
        ] = await Promise.all([
            supabase.from("usuarios").select("*").order("id", { ascending: false }),
            supabase.from("productos").select("*, categorias(nombre), inventario(id, stock)").order("id", { ascending: false }),
            supabase.from("pedidos").select("*").order("id", { ascending: false }).limit(20),
            supabase.from("categorias").select("*").order("id", { ascending: false }),
            supabase.from("proveedores").select("*").order("id", { ascending: false }),
            supabase.from("movimientos_inventario").select("*, productos(nombre)").order("id", { ascending: false }).limit(20),
            supabase.from("movimientos_zoles").select("*, usuarios(nombre)").order("id", { ascending: false }).limit(20)
        ]);

        // Calcular stats
        const totalVentas = (pedidos || []).reduce((a, p) => a + (p.total || 0), 0);
        const totalProductos = (productos || []).length;
        const totalUsuarios = (usuarios || []).length;
        const totalPedidos = (pedidos || []).length;

        container.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Panel de Administración</h1>
                    <p style="color: var(--text-muted);">Bienvenido, ${user.nombre}. Gestiona tu plataforma desde aquí.</p>
                </div>

                <!-- Stats Cards -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 3rem;">
                    <div style="background: var(--card-bg); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-left: 4px solid var(--primary-color);">
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Usuarios</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-main);">${totalUsuarios}</div>
                    </div>
                    <div style="background: var(--card-bg); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-left: 4px solid #3b82f6;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Productos</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-main);">${totalProductos}</div>
                    </div>
                    <div style="background: var(--card-bg); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-left: 4px solid #d97706;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Pedidos Recientes</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-main);">${totalPedidos}</div>
                    </div>
                    <div style="background: var(--card-bg); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-left: 4px solid #ef4444;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Ventas Totales</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-main);">$ ${totalVentas}</div>
                    </div>
                </div>

                <!-- Tabs de gestión -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap;">
                    <button class="admin-tab active" data-tab="usuarios" style="padding: 0.6rem 1.5rem; background: var(--primary-color); color: white; border: 1px solid var(--primary-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 600; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-users"></i> Usuarios
                    </button>
                    <button class="admin-tab" data-tab="pedidos" style="padding: 0.6rem 1.5rem; background: white; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 500; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-receipt"></i> Pedidos
                    </button>
                    <button class="admin-tab" data-tab="categorias" style="padding: 0.6rem 1.5rem; background: white; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 500; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-tags"></i> Categorías
                    </button>
                    <button class="admin-tab" data-tab="proveedores" style="padding: 0.6rem 1.5rem; background: white; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 500; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-truck"></i> Proveedores
                    </button>
                    <button class="admin-tab" data-tab="productos" style="padding: 0.6rem 1.5rem; background: white; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 500; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-boxes-stacked"></i> Productos
                    </button>
                    <button class="admin-tab" data-tab="movimientos" style="padding: 0.6rem 1.5rem; background: white; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 500; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-clock-rotate-left"></i> Movimientos
                    </button>
                </div>

                <div id="admin-tab-content" style="background: var(--card-bg); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 1px solid var(--border-color); overflow: hidden;"></div>
            </div>
        `;

        const tabContent = document.getElementById("admin-tab-content");

        const rolesMap = { 1: "Cliente", 2: "Admin", 3: "Proveedor" };

        // ── Tab renderers ──
        const renderTab = {
            usuarios: () => {
                tabContent.innerHTML = `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--primary-color);">
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">ID</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Nombre</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Email</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Rol</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; text-align: right;">Zoles</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(usuarios || []).map(u => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 1rem 1.5rem; font-weight: 600;">${u.id}</td>
                                        <td style="padding: 1rem 1.5rem;">${u.nombre || '—'}</td>
                                        <td style="padding: 1rem 1.5rem; color: var(--text-muted);">${u.email || '—'}</td>
                                        <td style="padding: 1rem 1.5rem;">
                                            <span style="background: ${u.rol_id === 2 ? '#dbeafe' : u.rol_id === 3 ? '#fef3c7' : '#dcfce7'}; color: ${u.rol_id === 2 ? '#2563eb' : u.rol_id === 3 ? '#d97706' : '#16a34a'}; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">${rolesMap[u.rol_id] || 'Desconocido'}</span>
                                        </td>
                                        <td style="padding: 1rem 1.5rem; text-align: right; font-weight: 700;">$ ${u.zoles ?? 0}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `;
            },
            pedidos: () => {
                tabContent.innerHTML = `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--primary-color);">
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">ID</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Usuario ID</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Fecha</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Estado</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(pedidos || []).map(p => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 1rem 1.5rem; font-weight: 600;">#${p.id.toString().padStart(5, '0')}</td>
                                        <td style="padding: 1rem 1.5rem; color: var(--text-muted);">${p.usuario_id}</td>
                                        <td style="padding: 1rem 1.5rem; color: var(--text-muted);">${p.fecha ? new Date(p.fecha).toLocaleString() : '—'}</td>
                                        <td style="padding: 1rem 1.5rem;">
                                            <span style="background: ${p.estado === 'completado' ? '#dcfce7' : '#fef3c7'}; color: ${p.estado === 'completado' ? '#16a34a' : '#d97706'}; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">${p.estado}</span>
                                        </td>
                                        <td style="padding: 1rem 1.5rem; text-align: right; font-weight: 700; color: var(--primary-color);">$ ${p.total} Zoles</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `;
            },
            categorias: () => {
                tabContent.innerHTML = `
                    <div style="padding: 2rem; border-bottom: 1px solid var(--border-color); background: var(--background-color);">
                        <h3 style="margin-bottom: 1rem;">Crear Categoría</h3>
                        <form id="form-categoria" style="display: flex; gap: 1rem; align-items: flex-end;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Nombre</label>
                                <input type="text" id="cat-nombre" required class="input-control" placeholder="Ej. Filtros">
                            </div>
                            <div style="flex: 2;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Descripción (opcional)</label>
                                <input type="text" id="cat-desc" class="input-control" placeholder="Descripción breve...">
                            </div>
                            <button type="submit" class="btn btn-primary" style="height: 42px;"><i class="fa-solid fa-plus"></i> Añadir</button>
                        </form>
                    </div>
                    <div style="padding: 2rem;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                            ${(categorias || []).map(c => `
                                <div style="padding: 1.5rem; background: var(--background-color); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-tag" style="color: var(--primary-color); margin-right: 0.5rem;"></i>${c.nombre}</div>
                                    <p style="color: var(--text-muted); font-size: 0.9rem;">${c.descripcion || 'Sin descripción'}</p>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `;

                document.getElementById("form-categoria").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const nombre = document.getElementById("cat-nombre").value;
                    const desc = document.getElementById("cat-desc").value;
                    try {
                        const { error } = await supabase.from("categorias").insert([{ nombre, descripcion: desc }]);
                        if (error) throw error;
                        window.location.reload();
                    } catch (err) {
                        alert("Error creando categoría: " + err.message);
                    }
                });
            },
            proveedores: () => {
                tabContent.innerHTML = `
                    <div style="padding: 2rem; border-bottom: 1px solid var(--border-color); background: var(--background-color);">
                        <h3 style="margin-bottom: 1rem;">Crear Proveedor</h3>
                        <form id="form-proveedor" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Nombre</label>
                                <input type="text" id="prov-nombre" required class="input-control" placeholder="Empresa S.A.">
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Teléfono</label>
                                <input type="text" id="prov-tel" class="input-control" placeholder="123456789">
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Email</label>
                                <input type="email" id="prov-email" class="input-control" placeholder="contacto@empresa.com">
                            </div>
                            <button type="submit" class="btn btn-primary" style="height: 42px;"><i class="fa-solid fa-plus"></i> Añadir</button>
                        </form>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--primary-color);">
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">ID</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Nombre</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Teléfono</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(proveedores || []).map(p => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 1rem 1.5rem; font-weight: 600;">${p.id}</td>
                                        <td style="padding: 1rem 1.5rem;">${p.nombre}</td>
                                        <td style="padding: 1rem 1.5rem; color: var(--text-muted);">${p.telefono || '—'}</td>
                                        <td style="padding: 1rem 1.5rem; color: var(--text-muted);">${p.email || '—'}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `;

                document.getElementById("form-proveedor").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const nombre = document.getElementById("prov-nombre").value;
                    const telefono = document.getElementById("prov-tel").value;
                    const email = document.getElementById("prov-email").value;
                    try {
                        const { error } = await supabase.from("proveedores").insert([{ nombre, telefono, email }]);
                        if (error) throw error;
                        window.location.reload();
                    } catch (err) {
                        alert("Error creando proveedor: " + err.message);
                    }
                });
            },
            productos: () => {
                tabContent.innerHTML = `
                    <div style="padding: 2rem; border-bottom: 1px solid var(--border-color); background: var(--background-color);">
                        <h3 style="margin-bottom: 1rem;">Crear Producto</h3>
                        <form id="form-producto" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Nombre</label>
                                <input type="text" id="prod-nombre" required class="input-control">
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Categoría</label>
                                <select id="prod-cat" class="input-control" required>
                                    <option value="">Selecciona...</option>
                                    ${(categorias || []).map(c => `<option value="${c.id}">${c.nombre}</option>`).join("")}
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Proveedor</label>
                                <select id="prod-prov" class="input-control">
                                    <option value="">Sin proveedor...</option>
                                    ${(proveedores || []).map(p => `<option value="${p.id}">${p.nombre}</option>`).join("")}
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 100px;">
                                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Precio</label>
                                <input type="number" id="prod-precio" required min="1" class="input-control">
                            </div>
                            <div style="width: 100%; display: flex; gap: 1rem;">
                                <div style="flex: 2;">
                                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Descripción</label>
                                    <input type="text" id="prod-desc" required class="input-control">
                                </div>
                                <div style="flex: 2;">
                                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">URL de Imagen</label>
                                    <input type="url" id="prod-img" class="input-control" placeholder="https://...">
                                </div>
                                <div style="flex: 1; display: flex; align-items: flex-end;">
                                    <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px;"><i class="fa-solid fa-plus"></i> Crear Producto</button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--primary-color);">
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Producto</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Categoría</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Precio</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Stock</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Actualizar Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(productos || []).map(p => {
                                    const stock = p.inventario ? p.inventario.reduce((a, i) => a + (i.stock || 0), 0) : 0;
                                    const invId = p.inventario && p.inventario.length > 0 ? p.inventario[0].id : null;
                                    return `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 1rem 1.5rem; font-weight: 600; display:flex; align-items:center; gap:0.5rem;">
                                            ${p.imagen_url ? `<img src="${p.imagen_url}" style="width:30px; height:30px; border-radius:4px; object-fit:cover;">` : ''}
                                            ${p.nombre}
                                        </td>
                                        <td style="padding: 1rem 1.5rem; color: var(--text-muted);">${p.categorias?.nombre || '—'}</td>
                                        <td style="padding: 1rem 1.5rem;">$ ${p.precio} Zoles</td>
                                        <td style="padding: 1rem 1.5rem; font-weight: 700; color: ${stock > 0 ? 'var(--primary-color)' : '#ef4444'};">${stock}</td>
                                        <td style="padding: 1rem 1.5rem;">
                                            ${invId ? `
                                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                                    <input type="number" class="admin-stock-input input-control" data-inv-id="${invId}" data-prod-id="${p.id}" data-prod-name="${p.nombre}" value="${stock}" min="0" style="width: 80px; padding: 0.4rem 0.6rem; font-size: 0.9rem;">
                                                    <button class="btn btn-primary btn-admin-update-stock" data-inv-id="${invId}" data-prod-id="${p.id}" data-prod-name="${p.nombre}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fa-solid fa-check"></i></button>
                                                </div>
                                            ` : '<span style="color: var(--text-muted); font-size: 0.85rem;">Sin inventario asociado</span>'}
                                        </td>
                                    </tr>
                                `}).join("")}
                            </tbody>
                        </table>
                    </div>
                `;

                // ── Formulario crear producto ──
                document.getElementById("form-producto").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const nombre = document.getElementById("prod-nombre").value;
                    const categoria_id = document.getElementById("prod-cat").value;
                    const proveedor_id = document.getElementById("prod-prov").value || null;
                    const precio = parseFloat(document.getElementById("prod-precio").value);
                    const descripcion = document.getElementById("prod-desc").value;
                    const imagen_url = document.getElementById("prod-img").value || null;

                    try {
                        // 1. Insertar producto
                        const { data: newProd, error: pErr } = await supabase
                            .from("productos")
                            .insert([{ nombre, categoria_id, proveedor_id, precio, descripcion, imagen_url }])
                            .select()
                            .single();
                        
                        if (pErr) throw pErr;

                        // 2. Crear registro en inventario (stock 0 por defecto)
                        const { error: iErr } = await supabase
                            .from("inventario")
                            .insert([{ producto_id: newProd.id, stock: 0 }]);
                            
                        if (iErr) throw iErr;

                        window.location.reload();
                    } catch (err) {
                        alert("Error creando producto: " + err.message);
                    }
                });

                // ── Stock update listeners (Admin) ──
                document.querySelectorAll(".btn-admin-update-stock").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const el = e.currentTarget;
                        const invId = parseInt(el.dataset.invId);
                        const prodId = parseInt(el.dataset.prodId);
                        const prodName = el.dataset.prodName;
                        const input = document.querySelector(`.admin-stock-input[data-inv-id="${invId}"]`);
                        const newStock = parseInt(input.value);

                        if (isNaN(newStock) || newStock < 0) {
                            alert("Stock debe ser un número positivo.");
                            return;
                        }

                        try {
                            el.disabled = true;
                            el.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                            const { data: currentInvList } = await supabase.from("inventario").select("stock").eq("id", invId).limit(1);
                            const currentInv = currentInvList ? currentInvList[0] : { stock: 0 };
                            const diff = newStock - (currentInv.stock || 0);

                            await supabase.from("inventario").update({ stock: newStock }).eq("id", invId);

                            if (diff !== 0) {
                                await supabase.from("movimientos_inventario").insert([{
                                    producto_id: prodId,
                                    tipo: diff > 0 ? "entrada" : "salida",
                                    cantidad: Math.abs(diff),
                                    descripcion: `Ajuste admin - ${prodName}`
                                }]);
                            }

                            el.innerHTML = '<i class="fa-solid fa-check" style="color: white;"></i>';
                            el.style.background = "#16a34a";
                            setTimeout(() => { window.location.reload(); }, 500);

                        } catch (error) {
                            alert("Error actualizando stock: " + error.message);
                            el.innerHTML = '<i class="fa-solid fa-check"></i>';
                            el.disabled = false;
                        }
                    });
                });
            },
            movimientos: () => {
                tabContent.innerHTML = `
                    <div style="padding: 2rem;">
                        <h4 style="margin-bottom: 1rem; color: var(--text-main);"><i class="fa-solid fa-warehouse" style="margin-right: 0.5rem;"></i>Movimientos de Inventario</h4>
                        <div style="margin-bottom: 2rem;">
                            ${(movInv || []).length === 0 ? '<p style="color: var(--text-muted);">Sin movimientos recientes.</p>' :
                            (movInv || []).map(m => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--background-color); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                    <div>
                                        <span style="font-weight: 600;">${m.productos?.nombre || 'Producto'}</span>
                                        <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">${m.descripcion || m.tipo}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <span style="font-weight: 700; color: ${m.tipo === 'salida' ? '#ef4444' : '#16a34a'};">
                                            ${m.tipo === 'salida' ? '-' : '+'}${m.cantidad}
                                        </span>
                                        <span style="color: var(--text-muted); font-size: 0.8rem;">${m.fecha ? new Date(m.fecha).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            `).join("")}
                        </div>

                        <h4 style="margin-bottom: 1rem; color: var(--text-main);"><i class="fa-solid fa-coins" style="margin-right: 0.5rem; color: #d97706;"></i>Movimientos de Zoles</h4>
                        <div>
                            ${(movZoles || []).length === 0 ? '<p style="color: var(--text-muted);">Sin movimientos recientes.</p>' :
                            (movZoles || []).map(m => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--background-color); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                    <div>
                                        <span style="font-weight: 600;">${m.usuarios?.nombre || 'Usuario'}</span>
                                        <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">${m.descripcion || m.tipo}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <span style="font-weight: 700; color: ${m.cantidad < 0 ? '#ef4444' : '#16a34a'};">
                                            ${m.cantidad < 0 ? '' : '+'}${m.cantidad} Zoles
                                        </span>
                                        <span style="color: var(--text-muted); font-size: 0.8rem;">${m.fecha ? new Date(m.fecha).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `;
            }
        };

        // ── Tab switching ──
        document.querySelectorAll(".admin-tab").forEach(tab => {
            tab.addEventListener("click", (e) => {
                const tabName = e.currentTarget.dataset.tab;

                document.querySelectorAll(".admin-tab").forEach(t => {
                    t.style.background = "white";
                    t.style.color = "var(--text-muted)";
                    t.style.borderColor = "var(--border-color)";
                    t.classList.remove("active");
                });
                e.currentTarget.style.background = "var(--primary-color)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.classList.add("active");

                if (renderTab[tabName]) renderTab[tabName]();
            });
        });

        // Render default tab
        renderTab.usuarios();

    } catch (error) {
        console.error("Error en dashboard admin:", error);
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #ef4444;">
                <h2>Error al cargar dashboard</h2>
                <p style="margin-top: 0.5rem; color: var(--text-muted);">${error.message}</p>
            </div>`;
    }
};
