// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dashboard Admin — Vista global + gestión de su sede
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal } from '../autenticacion/authService.js';
import { obtenerTodosLosUsuarios, obtenerTodosLosPedidos, asignarSucursalAUsuario } from '../../services/usuarioService.js';
import { obtenerProductosConInventario, obtenerMovimientosInventario } from '../../services/productosService.js';
import { obtenerSucursales, crearSucursal, eliminarSucursal } from '../../services/sucursalesService.js';
import { spinner, errorState } from '../../ui/components.js';

export const renderDashboardAdmin = async (container) => {
    const user = obtenerUsuarioLocal();
    if (!user || user.rol_id !== 2) { window.location.hash = '#/home'; return; }

    container.innerHTML = spinner('Cargando dashboard...');

    try {
        const html = await fetch('/templates/admin-dashboard.html').then(r => r.text());
        container.innerHTML = html;

        const [usuarios, productos, pedidos, movimientos, sucursales] = await Promise.all([
            obtenerTodosLosUsuarios(),
            obtenerProductosConInventario(),
            obtenerTodosLosPedidos(),
            obtenerMovimientosInventario(50),
            obtenerSucursales()
        ]);

        const totalVentas    = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
        const miSucursal     = sucursales.find(s => s.id === user.sucursal_id);
        const sucursalMap    = Object.fromEntries(sucursales.map(s => [s.id, s.nombre]));

        // Stat cards
        document.getElementById('admin-bienvenida').innerHTML = `
            Bienvenido, ${user.nombre}
            ${miSucursal
                ? `<span style="color:var(--text-muted); font-size:0.9rem;">
                       · <i class="fa-solid fa-location-dot" style="color:var(--primary-color);"></i>
                       ${miSucursal.nombre}
                   </span>`
                : `<span style="color:#ef4444; font-size:0.85rem;"> · Sin sede asignada</span>`}`;

        document.getElementById('stat-usuarios').textContent  = usuarios.length;
        document.getElementById('stat-productos').textContent = productos.length;
        document.getElementById('stat-pedidos').textContent   = pedidos.length;
        document.getElementById('stat-ventas').textContent    = `$ ${totalVentas}`;

        const tabContent = document.getElementById('admin-tab-content');

        const tabs = {
            // ── Tab Usuarios: asignar sucursal por fila ──
            usuarios: () => {
                tabContent.innerHTML = `
                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead><tr>
                                <th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th>
                                <th>Sucursal Asignada</th>
                                <th style="text-align:right;">Zoles</th>
                            </tr></thead>
                            <tbody>
                                ${usuarios.map(u => `
                                    <tr>
                                        <td style="color:var(--text-muted);">${u.id}</td>
                                        <td style="font-weight:600;">${u.nombre || '—'}</td>
                                        <td style="color:var(--text-muted); font-size:0.85rem;">${u.email}</td>
                                        <td>${['','Cliente','Admin','Proveedor'][u.rol_id] || '—'}</td>
                                        <td>
                                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                                <select class="select-asignar-suc input-control"
                                                    data-uid="${u.id}"
                                                    style="padding:0.3rem 0.5rem; font-size:0.85rem; min-width:140px;">
                                                    <option value="">— Sin asignar —</option>
                                                    ${sucursales.map(s =>
                                                        `<option value="${s.id}"
                                                            ${s.id === u.sucursal_id ? 'selected' : ''}>
                                                            ${s.nombre}
                                                         </option>`
                                                    ).join('')}
                                                </select>
                                                <button class="btn-asignar-suc btn btn-primary"
                                                    data-uid="${u.id}"
                                                    style="padding:0.3rem 0.7rem; font-size:0.8rem;">
                                                    <i class="fa-solid fa-check"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <td style="text-align:right; font-weight:700;
                                            color:var(--primary-color);">$ ${u.zoles ?? 0}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

                // Listeners asignar sucursal
                tabContent.querySelectorAll('.btn-asignar-suc').forEach(btn => {
                    btn.addEventListener('click', async e => {
                        const uid    = parseInt(e.currentTarget.dataset.uid);
                        const select = tabContent.querySelector(`.select-asignar-suc[data-uid="${uid}"]`);
                        const sucId  = select.value ? parseInt(select.value) : null;
                        try {
                            e.currentTarget.disabled   = true;
                            e.currentTarget.innerHTML  = '<i class="fa-solid fa-spinner fa-spin"></i>';
                            await asignarSucursalAUsuario(uid, sucId);
                            e.currentTarget.innerHTML      = '<i class="fa-solid fa-check" style="color:white;"></i>';
                            e.currentTarget.style.background = '#16a34a';
                            setTimeout(() => {
                                e.currentTarget.innerHTML        = '<i class="fa-solid fa-check"></i>';
                                e.currentTarget.style.background = '';
                                e.currentTarget.disabled         = false;
                            }, 1500);
                        } catch (err) {
                            alert('Error: ' + err.message);
                            e.currentTarget.disabled   = false;
                            e.currentTarget.innerHTML  = '<i class="fa-solid fa-check"></i>';
                        }
                    });
                });
            },

            // ── Tab Pedidos: con sucursal ──
            pedidos: () => {
                tabContent.innerHTML = pedidos.length === 0
                    ? `<p style="padding:3rem; text-align:center; color:var(--text-muted);">Sin pedidos.</p>`
                    : `<table class="table-admin">
                           <thead><tr>
                               <th>ID</th><th>Sucursal</th><th>Estado</th><th>Fecha</th>
                               <th style="text-align:right;">Total</th>
                           </tr></thead>
                           <tbody>
                               ${pedidos.map(p => `
                                   <tr>
                                       <td style="font-weight:600;">#${p.id.toString().padStart(5,'0')}</td>
                                       <td style="color:var(--text-muted);">
                                           <i class="fa-solid fa-location-dot"
                                               style="color:var(--primary-color); font-size:0.75rem;"></i>
                                           ${p.sucursales?.nombre ?? sucursalMap[p.sucursal_id] ?? '—'}
                                       </td>
                                       <td>${p.estado}</td>
                                       <td style="color:var(--text-muted); font-size:0.85rem;">
                                           ${p.fecha ? new Date(p.fecha).toLocaleDateString() : '—'}
                                       </td>
                                       <td style="text-align:right; font-weight:700;
                                           color:var(--primary-color);">$ ${p.total} Zoles</td>
                                   </tr>`).join('')}
                           </tbody>
                       </table>`;
            },

            // ── Tab Productos: stock global, solo lectura ──
            productos: () => {
                tabContent.innerHTML = `
                    <table class="table-admin">
                        <thead><tr>
                            <th>Producto</th><th>Categoría</th>
                            <th style="text-align:right;">Precio</th>
                            <th style="text-align:right;">Stock Total</th>
                        </tr></thead>
                        <tbody>
                            ${productos.map(p => `
                                <tr>
                                    <td style="font-weight:600;">${p.nombre}</td>
                                    <td style="color:var(--text-muted);">${p.categoria}</td>
                                    <td style="text-align:right;">$ ${p.precio} Zoles</td>
                                    <td style="text-align:right; font-weight:700;
                                        color:${p.stock_total > 0 ? 'var(--primary-color)' : '#ef4444'};">
                                        ${p.stock_total}
                                    </td>
                                </tr>`).join('')}
                        </tbody>
                    </table>`;
            },

            // ── Tab Movimientos: con sucursal ──
            movimientos: () => {
                tabContent.innerHTML = movimientos.length === 0
                    ? `<p style="padding:3rem; text-align:center; color:var(--text-muted);">Sin movimientos.</p>`
                    : `<table class="table-admin">
                           <thead><tr>
                               <th>Producto</th><th>Sucursal</th><th>Tipo</th>
                               <th>Fecha</th><th style="text-align:right;">Cant.</th>
                           </tr></thead>
                           <tbody>
                               ${movimientos.map(m => `
                                   <tr>
                                       <td style="font-weight:600;">${m.productos?.nombre || '—'}</td>
                                       <td style="color:var(--text-muted); font-size:0.9rem;">
                                           <i class="fa-solid fa-location-dot"
                                               style="color:var(--primary-color); font-size:0.75rem;"></i>
                                           ${m.sucursales?.nombre ?? sucursalMap[m.sucursal_id] ?? '—'}
                                       </td>
                                       <td style="color:${m.tipo==='entrada'?'#16a34a':'#ef4444'};
                                           font-weight:600;">${m.tipo}</td>
                                       <td style="color:var(--text-muted); font-size:0.85rem;">
                                           ${m.fecha ? new Date(m.fecha).toLocaleDateString() : '—'}
                                       </td>
                                       <td style="text-align:right; font-weight:700;
                                           color:${m.tipo==='entrada'?'#16a34a':'#ef4444'};">
                                           ${m.tipo==='entrada'?'+':'−'}${m.cantidad}
                                       </td>
                                   </tr>`).join('')}
                           </tbody>
                       </table>`;
            },

            sucursales: () => renderTabSucursales(sucursales, tabContent)
        };

        tabs.usuarios();
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const name = e.currentTarget.dataset.tab;
                if (tabs[name]) tabs[name]();
            });
        });

    } catch (error) {
        console.error('Error en dashboard admin:', error);
        container.innerHTML = errorState(error.message);
    }
};

// ── Tab Sucursales — CRUD ──
function renderTabSucursales(sucursales, tabContent) {
    tabContent.innerHTML = `
        <div style="padding:1.5rem 2rem; border-bottom:1px solid var(--border-color);
            background:var(--background-color);">
            <h4 style="margin-bottom:1rem; color:var(--text-main);">
                <i class="fa-solid fa-plus" style="color:var(--primary-color);"></i> Nueva Sucursal
            </h4>
            <div style="display:flex; gap:1rem; align-items:flex-end; flex-wrap:wrap;">
                <div class="input-group" style="margin:0; flex:1; min-width:180px;">
                    <label for="suc-nombre">Nombre</label>
                    <input type="text" id="suc-nombre" class="input-control"
                        placeholder="Ej: Sede Sur" style="padding:0.6rem 0.8rem;">
                </div>
                <div class="input-group" style="margin:0; flex:1; min-width:180px;">
                    <label for="suc-ubicacion">Ubicación</label>
                    <input type="text" id="suc-ubicacion" class="input-control"
                        placeholder="Ej: Lima" style="padding:0.6rem 0.8rem;">
                </div>
                <button id="btn-crear-sucursal" class="btn btn-primary"
                    style="padding:0.6rem 1.2rem; white-space:nowrap;">
                    <i class="fa-solid fa-plus"></i> Agregar
                </button>
            </div>
            <div id="suc-error" class="alert-error" style="display:none; margin-top:0.75rem;"></div>
        </div>

        <div style="overflow-x:auto;">
            <table class="table-admin" id="tabla-sucursales">
                <thead><tr>
                    <th>ID</th><th>Nombre</th><th>Ubicación</th>
                    <th style="text-align:center;">Acciones</th>
                </tr></thead>
                <tbody>
                    ${sucursales.length === 0
                        ? `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);
                               padding:2rem;">No hay sucursales.</td></tr>`
                        : sucursales.map(s => renderFilaSucursal(s)).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('btn-crear-sucursal').addEventListener('click', async () => {
        const nombre    = document.getElementById('suc-nombre').value.trim();
        const ubicacion = document.getElementById('suc-ubicacion').value.trim();
        const errorBox  = document.getElementById('suc-error');
        const btn       = document.getElementById('btn-crear-sucursal');
        errorBox.style.display = 'none';
        if (!nombre || !ubicacion) {
            errorBox.textContent = 'Completa nombre y ubicación.';
            errorBox.style.display = 'block';
            return;
        }
        try {
            btn.disabled    = true;
            btn.textContent = 'Guardando...';
            const nueva = await crearSucursal(nombre, ubicacion);
            const tbody = document.querySelector('#tabla-sucursales tbody');
            const sinDatos = tbody.querySelector('[colspan]');
            if (sinDatos) sinDatos.closest('tr').remove();
            tbody.insertAdjacentHTML('beforeend', renderFilaSucursal(nueva));
            attachEliminarListeners(tbody);
            document.getElementById('suc-nombre').value    = '';
            document.getElementById('suc-ubicacion').value = '';
        } catch (err) {
            errorBox.textContent   = err.message;
            errorBox.style.display = 'block';
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar';
        }
    });

    attachEliminarListeners(tabContent);
}

function renderFilaSucursal(s) {
    return `<tr data-suc-id="${s.id}">
        <td style="color:var(--text-muted);">${s.id}</td>
        <td style="font-weight:600;">${s.nombre}</td>
        <td style="color:var(--text-muted);">${s.ubicacion}</td>
        <td style="text-align:center;">
            <button class="btn-eliminar-suc" data-id="${s.id}"
                style="background:#fee2e2; border:none; color:#ef4444; cursor:pointer;
                       padding:0.4rem 0.8rem; border-radius:var(--radius-md); font-size:0.85rem;
                       font-family:var(--font-family); font-weight:600; transition:var(--transition);">
                <i class="fa-solid fa-trash"></i> Eliminar
            </button>
        </td>
    </tr>`;
}

function attachEliminarListeners(scope) {
    scope.querySelectorAll('.btn-eliminar-suc').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.replaceWith(clone);
    });
    scope.querySelectorAll('.btn-eliminar-suc').forEach(btn => {
        btn.addEventListener('click', async e => {
            const id  = parseInt(e.currentTarget.dataset.id);
            const row = document.querySelector(`tr[data-suc-id="${id}"]`);
            if (!confirm('¿Eliminar esta sucursal? Acción irreversible.')) return;
            try {
                e.currentTarget.disabled    = true;
                e.currentTarget.textContent = 'Eliminando...';
                await eliminarSucursal(id);
                row?.remove();
                const tbody = document.querySelector('#tabla-sucursales tbody');
                if (tbody?.children.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;
                        color:var(--text-muted); padding:2rem;">No hay sucursales.</td></tr>`;
                }
            } catch (err) {
                alert('No se pudo eliminar: ' + err.message);
                e.currentTarget.disabled  = false;
                e.currentTarget.innerHTML = '<i class="fa-solid fa-trash"></i> Eliminar';
            }
        });
    });
}