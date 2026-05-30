// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dashboard Proveedor — Solicitudes de Abastecimiento & Historial
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal } from '../autenticacion/authService.js';
import {
    obtenerProductosConInventario,
    obtenerMovimientosInventario
} from '../../services/productosService.js';
import { obtenerSucursales } from '../../services/sucursalesService.js';
import { spinner, errorState, estadoBadge } from '../../ui/components.js';
import { apiCall } from '../../core/middleware/index.js';
import { supabase } from '../../core/supabaseClient.js';

export const renderDashboardProveedor = async (container) => {
    const user = obtenerUsuarioLocal();
    if (!user || user.rol_id !== 3) {
        window.location.hash = '#/home';
        return;
    }

    container.innerHTML = spinner('Cargando panel de proveedor...');

    try {
        const html = await fetch('/templates/proveedor-dashboard.html').then(r => r.text());
        container.innerHTML = html;

        // Cargar datos iniciales
        const [prods, movimientos, sucursales] = await Promise.all([
            obtenerProductosConInventario(),
            obtenerMovimientosInventario(50),
            obtenerSucursales()
        ]);

        const miSucursalId   = user.sucursal_id;
        const miSucursal     = sucursales.find(s => s.id === miSucursalId);

        if (!miSucursalId) {
            document.getElementById('prov-bienvenida').innerHTML = 
                `<span style="color:#ef4444; font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> Sin sede asignada. Solicita a un administrador que te asigne una sucursal en tu perfil para poder enviar abastecimientos.</span>`;
            document.getElementById('prov-tab-content').innerHTML = `
                <div style="padding:4rem; text-align:center;">
                    <i class="fa-solid fa-user-gear" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;display:block;"></i>
                    <h3>Acceso Restringido</h3>
                    <p style="color:var(--text-muted);">Debes tener una sede de trabajo asignada para registrar entregas.</p>
                </div>`;
            return;
        }

        // Cargar estadísticas
        const miInventario = prods.flatMap(p => p.inventario.filter(i => i.sucursal_id === miSucursalId));
        const miStockTotal = miInventario.reduce((a, i) => a + i.stock, 0);

        // Obtener solicitudes de este proveedor
        const misSolicitudes = await apiCall('solicitudes_entrega:select', {
            select: '*, productos(nombre)',
            filter: { proveedor_id: user.id },
            order: 'id',
            ascending: false
        });

        document.getElementById('prov-bienvenida').innerHTML = `
            Trabajando en: <strong>${miSucursal.nombre}</strong> · <span style="color:var(--text-muted); font-size:0.9rem;">${miSucursal.ubicacion}</span>`;

        document.getElementById('prov-stat-productos').textContent   = prods.length;
        document.getElementById('prov-stat-stock').textContent       = `${miStockTotal} u.`;
        document.getElementById('prov-stat-movimientos').textContent = misSolicitudes.length;

        const tabContent = document.getElementById('prov-tab-content');

        // Toast de notificación
        const showToast = (message, type = 'success') => {
            const toast = document.createElement('div');
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.padding = '1rem 1.5rem';
            toast.style.borderRadius = 'var(--radius-md)';
            toast.style.background = type === 'success' ? '#16a34a' : '#ef4444';
            toast.style.color = 'white';
            toast.style.fontWeight = 'bold';
            toast.style.boxShadow = 'var(--shadow-lg)';
            toast.style.zIndex = '9999';
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${message}`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            }, 50);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        const tabs = {
            // ━━━ TAB 1: SOLICITAR ENTREGA (Formulario + Historial de solicitudes) ━━━
            solicitar: () => {
                tabContent.innerHTML = `
                    <div style="padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-color); background: var(--background-color);">
                        <h4 style="margin-top:0; margin-bottom:0.5rem;"><i class="fa-solid fa-file-invoice" style="color:var(--primary-color);"></i> Crear Nueva Solicitud de Abastecimiento</h4>
                        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">Registra los productos que estás entregando a la sede <strong>${miSucursal.nombre}</strong>. Un administrador deberá verificar y aprobar la entrega.</p>
                        
                        <div style="display:flex; gap:1rem; align-items:flex-end; flex-wrap:wrap;">
                            <div class="input-group" style="margin:0; flex:2; min-width:220px;">
                                <label>Producto a Abastecer</label>
                                <select id="sol-prod" class="input-control" required>
                                    <option value="">— Seleccionar del catálogo global —</option>
                                    ${prods.map(p => `<option value="${p.id}">${p.nombre} (S/. ${p.precio})</option>`).join('')}
                                </select>
                            </div>
                            <div class="input-group" style="margin:0; width:120px;">
                                <label>Cantidad</label>
                                <input id="sol-cant" type="number" class="input-control" value="10" min="1" required>
                            </div>
                            <button id="btn-crear-solicitud" class="btn btn-primary" style="white-space:nowrap;">
                                <i class="fa-solid fa-paper-plane"></i> Enviar Solicitud
                            </button>
                        </div>
                    </div>

                    <div style="padding:1.25rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0;"><i class="fa-solid fa-receipt"></i> Mis Solicitudes de Abastecimiento</h4>
                    </div>

                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Estado de Aprobación</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${misSolicitudes.map(s => {
                                    const dateStr = s.fecha ? new Date(s.fecha).toLocaleDateString() : '—';
                                    let badgeColor = '#fef3c7'; let textColor = '#d97706';
                                    if (s.estado === 'aprobado') { badgeColor = '#dcfce7'; textColor = '#16a34a'; }
                                    if (s.estado === 'rechazado') { badgeColor = '#fee2e2'; textColor = '#ef4444'; }
                                    
                                    return `
                                        <tr>
                                            <td style="color:var(--text-muted); font-size:0.85rem;">${dateStr}</td>
                                            <td style="font-weight:600;">${s.productos?.nombre || '—'}</td>
                                            <td style="font-weight:700;">${s.cantidad} unidades</td>
                                            <td>
                                                <span style="background:${badgeColor}; color:${textColor}; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">
                                                    ${s.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('') || '<tr><td colspan="4" style="text-align:center;padding:3rem;color:var(--text-muted);">No has enviado ninguna solicitud de entrega aún.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;

                // Registrar entrega
                document.getElementById('btn-crear-solicitud')?.addEventListener('click', async () => {
                    const btn = document.getElementById('btn-crear-solicitud');
                    const prodId = parseInt(document.getElementById('sol-prod').value);
                    const cant = parseInt(document.getElementById('sol-cant').value);

                    if (!prodId || isNaN(cant) || cant <= 0) {
                        showToast('Selecciona un producto y define una cantidad válida.', 'error');
                        return;
                    }

                    try {
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

                        await apiCall('solicitudes_entrega:insert', {
                            data: {
                                proveedor_id: user.id,
                                producto_id: prodId,
                                sucursal_id: miSucursalId,
                                cantidad: cant,
                                estado: 'pendiente'
                            }
                        });

                        showToast('Solicitud de abastecimiento enviada al administrador.');
                        setTimeout(() => renderDashboardProveedor(container), 1000);

                    } catch(err) {
                        showToast(err.message, 'error');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud';
                    }
                });
            },

            // ━━━ TAB 2: VER STOCK (Listado de stock local en su sede, sólo lectura) ━━━
            inventario: () => {
                const renderFilas = (searchQuery = '') => {
                    let filtered = miInventario;
                    if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        filtered = filtered.filter(i => 
                            i.producto_nombre.toLowerCase().includes(q)
                        );
                    }

                    const tbody = document.getElementById('prov-stock-tbody');
                    if (!tbody) return;

                    if (filtered.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:3rem;color:var(--text-muted);">No hay productos en esta sede que coincidan con la búsqueda.</td></tr>';
                        return;
                    }

                    tbody.innerHTML = filtered.map(inv => {
                        const p = prods.find(prod => prod.id === inv.producto_id);
                        return `
                            <tr>
                                <td style="font-weight:600; display:flex; align-items:center; gap:0.5rem;">
                                    ${p?.imagen_url ? `<img src="${p.imagen_url}" style="width:28px;height:28px;border-radius:4px;object-fit:cover;">` : ''}
                                    ${inv.producto_nombre}
                                </td>
                                <td style="color:var(--text-muted); font-size:0.85rem;">${p?.categoria || 'Sin categoría'}</td>
                                <td>S/. ${p?.precio || 0}</td>
                                <td style="font-weight:700; color:${inv.stock > 0 ? 'var(--primary-color)' : '#ef4444'};">
                                    ${inv.stock} unidades
                                </td>
                            </tr>
                        `;
                    }).join('');
                };

                tabContent.innerHTML = `
                    <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-color); background: var(--background-color); display:flex; gap:1rem; align-items:center;">
                        <div style="flex:1; position:relative;">
                            <input id="prov-stock-search" class="input-control" placeholder="Buscar producto en stock..." style="width: 100%; padding-left: 2rem;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.75rem; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
                        </div>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Precio Base</th>
                                    <th>Stock Local</th>
                                </tr>
                            </thead>
                            <tbody id="prov-stock-tbody"></tbody>
                        </table>
                    </div>
                `;

                renderFilas();

                document.getElementById('prov-stock-search').addEventListener('input', e => renderFilas(e.target.value));
            },

            // ━━━ TAB 3: MOVIMIENTOS SEDE (Historial de entradas y salidas de la sucursal) ━━━
            movimientos: () => {
                const localMovs = movimientos.filter(m => m.sucursal_id === miSucursalId);

                if (localMovs.length === 0) {
                    tabContent.innerHTML = `
                        <div style="padding: 4rem; text-align: center;">
                            <i class="fa-solid fa-clock-rotate-left" style="font-size:2.5rem;color:var(--text-muted);margin-bottom:1rem;display:block;opacity:0.6;"></i>
                            <p style="color:var(--text-muted);margin:0;">Sin movimientos de inventario en tu sucursal.</p>
                        </div>`;
                    return;
                }

                tabContent.innerHTML = `
                    <div style="padding:1.25rem; border-bottom:1px solid var(--border-color); background:var(--background-color);">
                        <h4 style="margin:0;"><i class="fa-solid fa-clock-rotate-left"></i> Historial de Movimientos de la Sede</h4>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th style="text-align:right;">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${localMovs.map(m => `
                                    <tr>
                                        <td style="font-weight:600;">${m.productos?.nombre || '—'}</td>
                                        <td style="color:${m.tipo==='salida'?'#ef4444':'#16a34a'}; font-weight:600;">${m.tipo}</td>
                                        <td style="color:var(--text-muted); font-size:0.85rem;">
                                            ${m.fecha ? new Date(m.fecha).toLocaleDateString() : '—'}
                                        </td>
                                        <td style="text-align:right; font-weight:700; color:${m.tipo==='salida'?'#ef4444':'#16a34a'};">
                                            ${m.tipo==='salida'?'−':'+'}${m.cantidad}
                                        </td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        };

        // Escucha de pestañas
        document.querySelectorAll('.prov-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                document.querySelectorAll('.prov-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const name = e.currentTarget.dataset.tab;
                if (tabs[name]) tabs[name]();
            });
        });

        // Tab inicial
        tabs.solicitar();

    } catch (error) {
        console.error('Error en dashboard proveedor:', error);
        container.innerHTML = errorState(error.message);
    }
};
