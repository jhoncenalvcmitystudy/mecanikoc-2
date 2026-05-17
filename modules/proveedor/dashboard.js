// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dashboard Proveedor — Solo su sucursal (editable) + global (lectura)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal } from '../autenticacion/authService.js';
import {
    obtenerProductosConInventario,
    obtenerMovimientosInventario,
    actualizarStock,
    obtenerStockActual,
    registrarMovimientoInventario
} from '../../services/productosService.js';
import { obtenerSucursales } from '../../services/sucursalesService.js';
import { spinner, errorState } from '../../ui/components.js';

export const renderDashboardProveedor = async (container) => {
    const user = obtenerUsuarioLocal();
    if (!user || (user.rol_id !== 3 && user.rol_id !== 2)) {
        window.location.hash = '#/home';
        return;
    }

    container.innerHTML = spinner('Cargando panel de proveedor...');

    try {
        const html = await fetch('/templates/proveedor-dashboard.html').then(r => r.text());
        container.innerHTML = html;

        const [prods, movimientos, sucursales] = await Promise.all([
            obtenerProductosConInventario(),
            obtenerMovimientosInventario(30),
            obtenerSucursales()
        ]);

        const miSucursalId   = user.sucursal_id;
        const miSucursal     = sucursales.find(s => s.id === miSucursalId);

        // Stats filtradas a la propia sucursal
        const miInventario   = prods.flatMap(p => p.inventario.filter(i => i.sucursal_id === miSucursalId));
        const miStock        = miInventario.reduce((a, i) => a + i.stock, 0);
        const misMov         = movimientos.filter(m => m.sucursal_id === miSucursalId);

        document.getElementById('prov-bienvenida').innerHTML = `
            ${miSucursal
                ? `Tu sede: <strong>${miSucursal.nombre}</strong> · ${miSucursal.ubicacion}`
                : `<span style="color:#ef4444;">Sin sede asignada — contacta al administrador</span>`}`;

        document.getElementById('prov-stat-productos').textContent   = prods.length;
        document.getElementById('prov-stat-stock').textContent       = miStock;
        document.getElementById('prov-stat-movimientos').textContent = misMov.length;

        const tabContent = document.getElementById('prov-tab-content');

        // ── Modo de vista: 'mine' (editable) | 'all' (solo lectura) ──
        let modoVista = 'mine';

        const renderToggle = () => `
            <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem;">
                <button class="btn ${modoVista === 'mine' ? 'btn-primary' : 'btn-outline'}" id="btn-ver-mine"
                    style="font-size:0.9rem; padding:0.5rem 1rem;">
                    <i class="fa-solid fa-location-dot"></i> Mi sucursal
                </button>
                <button class="btn ${modoVista === 'all' ? 'btn-primary' : 'btn-outline'}" id="btn-ver-all"
                    style="font-size:0.9rem; padding:0.5rem 1rem;">
                    <i class="fa-solid fa-earth-americas"></i> Todas las sucursales
                    <span style="background:rgba(0,0,0,0.15); border-radius:4px; padding:0.1rem 0.4rem;
                        font-size:0.75rem; margin-left:0.25rem;">solo lectura</span>
                </button>
            </div>
        `;

        const tabs = {
            productos: () => {
                // Construir filas: my_branch = editable, other = lectura
                const filas = [];
                for (const p of prods) {
                    const invList = modoVista === 'mine'
                        ? p.inventario.filter(i => i.sucursal_id === miSucursalId)
                        : p.inventario;

                    if (invList.length === 0 && modoVista === 'mine') continue; // producto sin stock en mi sucursal

                    for (const inv of invList) {
                        filas.push({ producto: p, inv, editable: inv.sucursal_id === miSucursalId });
                    }
                }

                tabContent.innerHTML = renderToggle() + (filas.length === 0
                    ? `<div style="text-align:center; padding:3rem; color:var(--text-muted);">
                           ${miSucursalId
                               ? 'No hay productos con inventario en tu sucursal.'
                               : 'Sin sede asignada. Contacta al administrador.'}
                       </div>`
                    : `<div style="overflow-x:auto;">
                           <table class="table-admin">
                               <thead><tr>
                                   <th>Producto</th><th>Categoría</th><th>Precio</th>
                                   <th>Sucursal</th>
                                   <th style="text-align:center;">Stock</th>
                                   <th style="text-align:center;">
                                       ${modoVista === 'mine' ? 'Actualizar' : 'Solo lectura'}
                                   </th>
                               </tr></thead>
                               <tbody>
                                   ${filas.map(({ producto: p, inv, editable }) => `
                                       <tr ${!editable ? 'style="opacity:0.65;"' : ''}>
                                           <td style="font-weight:600; display:flex; align-items:center; gap:0.5rem;">
                                               ${p.imagen_url
                                                   ? `<img src="${p.imagen_url}"
                                                       style="width:28px;height:28px;border-radius:4px;object-fit:cover;">`
                                                   : ''}
                                               ${p.nombre}
                                           </td>
                                           <td style="color:var(--text-muted);">${p.categoria}</td>
                                           <td>$ ${p.precio} Zoles</td>
                                           <td>
                                               <span style="display:inline-flex; align-items:center; gap:0.3rem;
                                                   ${editable ? 'color:var(--primary-color); font-weight:600;' : 'color:var(--text-muted);'}
                                                   font-size:0.9rem;">
                                                   <i class="fa-solid fa-location-dot"></i>
                                                   ${inv.sucursal_nombre}
                                                   ${editable ? '(mi sede)' : ''}
                                               </span>
                                           </td>
                                           <td style="text-align:center; font-weight:700;
                                               color:${inv.stock > 0 ? 'var(--primary-color)' : '#ef4444'};">
                                               ${inv.stock}
                                           </td>
                                           <td style="text-align:center;">
                                               ${editable
                                                   ? `<div style="display:inline-flex; gap:0.4rem; align-items:center;">
                                                          <input type="number" class="stock-input input-control"
                                                              data-inv-id="${inv.id}"
                                                              data-prod-id="${p.id}"
                                                              data-suc-id="${inv.sucursal_id}"
                                                              value="${inv.stock}" min="0"
                                                              style="width:80px;padding:0.35rem 0.5rem;font-size:0.9rem;">
                                                          <button class="btn btn-primary btn-update-stock"
                                                              data-inv-id="${inv.id}"
                                                              data-prod-id="${p.id}"
                                                              data-suc-id="${inv.sucursal_id}"
                                                              style="padding:0.35rem 0.7rem;font-size:0.85rem;">
                                                              <i class="fa-solid fa-check"></i>
                                                          </button>
                                                      </div>`
                                                   : `<span style="color:var(--text-muted); font-size:0.8rem;">
                                                          <i class="fa-solid fa-eye"></i> lectura
                                                      </span>`}
                                           </td>
                                       </tr>`).join('')}
                               </tbody>
                           </table>
                       </div>`
                );

                // Listeners toggle
                document.getElementById('btn-ver-mine')?.addEventListener('click', () => {
                    modoVista = 'mine'; tabs.productos();
                });
                document.getElementById('btn-ver-all')?.addEventListener('click', () => {
                    modoVista = 'all'; tabs.productos();
                });

                // Listeners stock (solo filas editables)
                document.querySelectorAll('.btn-update-stock').forEach(btn => {
                    btn.addEventListener('click', async e => {
                        const el       = e.currentTarget;
                        const invId    = parseInt(el.dataset.invId);
                        const prodId   = parseInt(el.dataset.prodId);
                        const sucId    = parseInt(el.dataset.sucId);
                        const input    = document.querySelector(`.stock-input[data-inv-id="${invId}"]`);
                        const newStock = parseInt(input.value);

                        if (isNaN(newStock) || newStock < 0) {
                            alert('El stock debe ser un número positivo.');
                            return;
                        }
                        try {
                            el.disabled  = true;
                            el.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                            const { stock: actual } = await obtenerStockActual(invId);
                            await actualizarStock(invId, newStock);
                            const diff = newStock - actual;
                            if (diff !== 0) {
                                await registrarMovimientoInventario(
                                    prodId, sucId,
                                    diff > 0 ? 'entrada' : 'salida',
                                    Math.abs(diff)
                                );
                            }
                            el.innerHTML        = '<i class="fa-solid fa-check" style="color:white;"></i>';
                            el.style.background = '#16a34a';
                            setTimeout(() => {
                                el.innerHTML        = '<i class="fa-solid fa-check"></i>';
                                el.style.background = '';
                                el.disabled         = false;
                            }, 1500);
                        } catch (err) {
                            alert('Error: ' + err.message);
                            el.innerHTML = '<i class="fa-solid fa-check"></i>';
                            el.disabled  = false;
                        }
                    });
                });
            },

            movimientos: () => {
                const lista = modoVista === 'mine'
                    ? movimientos.filter(m => m.sucursal_id === miSucursalId)
                    : movimientos;

                tabContent.innerHTML = renderToggle() + (lista.length === 0
                    ? `<p style="padding:2rem; text-align:center; color:var(--text-muted);">
                           Sin movimientos en tu sucursal.
                       </p>`
                    : `<div style="overflow-x:auto;">
                           <table class="table-admin">
                               <thead><tr>
                                   <th>Producto</th><th>Sucursal</th><th>Tipo</th>
                                   <th>Fecha</th><th style="text-align:right;">Cant.</th>
                               </tr></thead>
                               <tbody>
                                   ${lista.map(m => `
                                       <tr>
                                           <td style="font-weight:600;">${m.productos?.nombre || '—'}</td>
                                           <td style="color:var(--text-muted); font-size:0.9rem;">
                                               <i class="fa-solid fa-location-dot"
                                                   style="color:var(--primary-color); font-size:0.75rem;"></i>
                                               ${m.sucursales?.nombre || '—'}
                                           </td>
                                           <td style="color:${m.tipo==='salida'?'#ef4444':'#16a34a'};
                                               font-weight:600;">${m.tipo}</td>
                                           <td style="color:var(--text-muted); font-size:0.85rem;">
                                               ${m.fecha ? new Date(m.fecha).toLocaleDateString() : '—'}
                                           </td>
                                           <td style="text-align:right; font-weight:700;
                                               color:${m.tipo==='salida'?'#ef4444':'#16a34a'};">
                                               ${m.tipo==='salida'?'−':'+'}${m.cantidad}
                                           </td>
                                       </tr>`).join('')}
                               </tbody>
                           </table>
                       </div>`
                );

                // Toggle listeners en el tab movimientos también
                document.getElementById('btn-ver-mine')?.addEventListener('click', () => {
                    modoVista = 'mine'; tabs.movimientos();
                });
                document.getElementById('btn-ver-all')?.addEventListener('click', () => {
                    modoVista = 'all'; tabs.movimientos();
                });
            }
        };

        document.querySelectorAll('.prov-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                document.querySelectorAll('.prov-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const name = e.currentTarget.dataset.tab;
                if (tabs[name]) tabs[name]();
            });
        });

        tabs.productos();

    } catch (error) {
        console.error('Error en dashboard proveedor:', error);
        container.innerHTML = errorState(error.message);
    }
};
