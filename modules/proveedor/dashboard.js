// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dashboard Proveedor — Panel de proveedor (Supabase)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from "../../core/supabaseClient.js";
import { obtenerUsuarioLocal } from "../autenticacion/authService.js";

export const renderDashboardProveedor = async (container) => {
    const user = obtenerUsuarioLocal();
    // Permitir acceso a Proveedor (3) y Admin (2)
    if (!user || (user.rol_id !== 3 && user.rol_id !== 2)) {
        window.location.hash = "#/home";
        return;
    }

    container.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">Cargando panel de proveedor...</p>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    try {
        // Cargar todos los productos (sin filtrar por proveedor_id, ya que no hay relación compleja)
        const { data: productosProveedor } = await supabase
            .from("productos")
            .select("*, categorias(nombre), inventario(id, stock)")
            .order("id", { ascending: false });

        const prods = productosProveedor || [];

        // Movimientos de inventario
        const { data: movs } = await supabase
            .from("movimientos_inventario")
            .select("*, productos(nombre)")
            .order("id", { ascending: false })
            .limit(30);

        const movimientos = movs || [];

        const totalStock = prods.reduce((acc, p) => {
            const stock = p.inventario ? p.inventario.reduce((a, i) => a + (i.stock || 0), 0) : 0;
            return acc + stock;
        }, 0);

        container.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Panel de Proveedor</h1>
                    <p style="color: var(--text-muted);">Bienvenido, ${user.nombre}. Gestiona los productos e inventario.</p>
                </div>

                <!-- Stats -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3rem;">
                    <div style="background: var(--card-bg); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-left: 4px solid var(--primary-color);">
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Productos en Catálogo</div>
                        <div style="font-size: 2.5rem; font-weight: 800;">${prods.length}</div>
                    </div>
                    <div style="background: var(--card-bg); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-left: 4px solid #3b82f6;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Stock Total</div>
                        <div style="font-size: 2.5rem; font-weight: 800;">${totalStock}</div>
                    </div>
                    <div style="background: var(--card-bg); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-left: 4px solid #d97706;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Movimientos Registrados</div>
                        <div style="font-size: 2.5rem; font-weight: 800;">${movimientos.length}</div>
                    </div>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem;">
                    <button class="prov-tab active" data-tab="productos" style="padding: 0.6rem 1.5rem; background: var(--primary-color); color: white; border: 1px solid var(--primary-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 600; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-boxes-stacked"></i> Productos
                    </button>
                    <button class="prov-tab" data-tab="movimientos" style="padding: 0.6rem 1.5rem; background: white; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: var(--radius-full); cursor: pointer; font-weight: 500; font-family: var(--font-family); transition: var(--transition);">
                        <i class="fa-solid fa-clock-rotate-left"></i> Movimientos
                    </button>
                </div>

                <div id="prov-tab-content" style="background: var(--card-bg); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 1px solid var(--border-color); overflow: hidden;"></div>
            </div>
        `;

        const provTabContent = document.getElementById("prov-tab-content");

        const provRenderTab = {
            productos: () => {
                provTabContent.innerHTML = `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--primary-color);">
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Producto</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Categoría</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Precio</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Stock</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Estado</th>
                                    <th style="padding: 1rem 1.5rem; color: white; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Actualizar Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${prods.map(p => {
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
                                            <span style="background: ${p.activo !== false ? '#dcfce7' : '#fee2e2'}; color: ${p.activo !== false ? '#16a34a' : '#ef4444'}; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">${p.activo !== false ? 'Activo' : 'Inactivo'}</span>
                                        </td>
                                        <td style="padding: 1rem 1.5rem;">
                                            ${invId ? `
                                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                                    <input type="number" class="stock-input input-control" data-inv-id="${invId}" data-prod-id="${p.id}" data-prod-name="${p.nombre}" value="${stock}" min="0" style="width: 80px; padding: 0.4rem 0.6rem; font-size: 0.9rem;">
                                                    <button class="btn btn-primary btn-update-stock" data-inv-id="${invId}" data-prod-id="${p.id}" data-prod-name="${p.nombre}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fa-solid fa-check"></i></button>
                                                </div>
                                            ` : '<span style="color: var(--text-muted); font-size: 0.85rem;">Sin inventario asociado</span>'}
                                        </td>
                                    </tr>
                                `}).join("")}
                            </tbody>
                        </table>
                    </div>
                `;

                // ── Stock update listeners ──
                document.querySelectorAll(".btn-update-stock").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const el = e.currentTarget;
                        const invId = parseInt(el.dataset.invId);
                        const prodId = parseInt(el.dataset.prodId);
                        const prodName = el.dataset.prodName;
                        const input = document.querySelector(`.stock-input[data-inv-id="${invId}"]`);
                        const newStock = parseInt(input.value);

                        if (isNaN(newStock) || newStock < 0) {
                            alert("Stock debe ser un número positivo.");
                            return;
                        }

                        try {
                            el.disabled = true;
                            el.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                            // Obtener stock actual
                            const { data: currentInvList } = await supabase
                                .from("inventario")
                                .select("stock")
                                .eq("id", invId)
                                .limit(1);

                            const currentInv = currentInvList ? currentInvList[0] : { stock: 0 };
                            const diff = newStock - (currentInv.stock || 0);

                            // Actualizar stock
                            await supabase
                                .from("inventario")
                                .update({ stock: newStock })
                                .eq("id", invId);

                            // Registrar movimiento si hay diferencia
                            if (diff !== 0) {
                                await supabase
                                    .from("movimientos_inventario")
                                    .insert([{
                                        producto_id: prodId,
                                        tipo: diff > 0 ? "entrada" : "salida",
                                        cantidad: Math.abs(diff),
                                        descripcion: `Ajuste manual - ${prodName}`
                                    }]);
                            }

                            el.innerHTML = '<i class="fa-solid fa-check" style="color: white;"></i>';
                            el.style.background = "#16a34a";
                            setTimeout(() => {
                                el.innerHTML = '<i class="fa-solid fa-check"></i>';
                                el.style.background = "";
                                el.disabled = false;
                            }, 1500);

                        } catch (error) {
                            alert("Error actualizando stock: " + error.message);
                            el.innerHTML = '<i class="fa-solid fa-check"></i>';
                            el.disabled = false;
                        }
                    });
                });
            },
            movimientos: () => {
                provTabContent.innerHTML = `
                    <div style="padding: 2rem;">
                        ${movimientos.length === 0 ? '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Sin movimientos recientes.</p>' :
                        movimientos.map(m => `
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
                `;
            }
        };

        // Tab switching
        document.querySelectorAll(".prov-tab").forEach(tab => {
            tab.addEventListener("click", (e) => {
                const tabName = e.currentTarget.dataset.tab;
                document.querySelectorAll(".prov-tab").forEach(t => {
                    t.style.background = "white";
                    t.style.color = "var(--text-muted)";
                    t.style.borderColor = "var(--border-color)";
                    t.classList.remove("active");
                });
                e.currentTarget.style.background = "var(--primary-color)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.classList.add("active");
                if (provRenderTab[tabName]) provRenderTab[tabName]();
            });
        });

        provRenderTab.productos();

    } catch (error) {
        console.error("Error en dashboard proveedor:", error);
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #ef4444;">
                <h2>Error al cargar panel</h2>
                <p style="margin-top: 0.5rem; color: var(--text-muted);">${error.message}</p>
            </div>`;
    }
};
