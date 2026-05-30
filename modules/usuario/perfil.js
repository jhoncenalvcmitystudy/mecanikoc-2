// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Perfil — Datos del usuario + historial + sucursal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
    obtenerUsuarioLocal, guardarUsuarioLocal,
    obtenerUsuarioPorId, cerrarSesion, obtenerNombreRol
} from '../autenticacion/authService.js';
import { obtenerPedidosDeUsuario, obtenerMovimientosSoles, actualizarMiSucursal } from '../../services/usuarioService.js';
import { obtenerSucursales } from '../../services/sucursalesService.js';
import { spinner, errorState, estadoBadge } from '../../ui/components.js';

export const renderPerfil = async (container) => {
    let user = obtenerUsuarioLocal();
    if (!user) { window.location.hash = '#/login'; return; }

    container.innerHTML = spinner('Cargando perfil...');

    try {
        const [usuarioActual, misPedidos, movSoles, sucursales] = await Promise.all([
            obtenerUsuarioPorId(user.id),
            obtenerPedidosDeUsuario(user.id),
            obtenerMovimientosSoles(user.id),
            obtenerSucursales()
        ]);
        user = usuarioActual;
        guardarUsuarioLocal(user);

        const rolNombre          = obtenerNombreRol(user.rol_id);
        const sucursalActual     = sucursales.find(s => s.id === user.sucursal_id);
        const puedeEditarSucursal = user.rol_id === 1; // solo clientes eligen su sede

        container.innerHTML = `
            <div style="max-width:1000px; margin:0 auto;">

                <!-- Tarjeta perfil -->
                <div style="background:var(--card-bg); padding:2.5rem; box-shadow:var(--shadow-md);
                    margin-bottom:1.5rem; border:1px solid var(--border-color); border-radius:var(--radius-lg);
                    display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:2rem;">
                    <div style="display:flex; gap:2rem; align-items:center;">
                        <div style="width:80px; height:80px; background:var(--primary-color); border-radius:50%;
                            display:flex; align-items:center; justify-content:center; font-size:2.5rem; color:white;">
                            ${user.nombre?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                            <h2 style="font-size:1.8rem; margin-bottom:0.2rem; color:var(--text-main);">
                                ${user.nombre || 'Sin nombre'}
                            </h2>
                            <p style="color:var(--text-muted); margin-bottom:0.5rem;">${user.email || ''}</p>
                            <span style="background:var(--background-color); border:1px solid var(--border-color);
                                padding:0.2rem 0.8rem; border-radius:var(--radius-full); font-size:0.78rem;
                                font-weight:700; color:var(--text-muted); text-transform:uppercase;">
                                ${rolNombre}
                            </span>
                        </div>
                    </div>
                    <div style="background:white; padding:1.5rem 2.5rem; border-radius:var(--radius-lg);
                        box-shadow:var(--shadow-sm); border:1px solid #fde68a; text-align:right;">
                        <div style="font-size:2.2rem; font-weight:800; color:#d97706;">S/. ${user.soles ?? 0}</div>
                        <div style="color:#b45309; text-transform:uppercase; font-size:0.85rem; font-weight:700;">
                            Soles Disponibles
                        </div>
                    </div>
                </div>

                <!-- Tarjeta Sucursal -->
                <div style="background:var(--card-bg); border-radius:var(--radius-lg); padding:2rem;
                    box-shadow:var(--shadow-sm); border:1px solid var(--border-color); margin-bottom:1.5rem;">
                    
                    <h3 style="font-size:1.1rem; margin-top:0; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem; color:var(--text-main);">
                        <i class="fa-solid fa-truck-ramp-box" style="color:var(--primary-color);"></i>
                        Configuración de Despacho y Sucursal de Envío
                    </h3>
                    
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem; line-height:1.5;">
                        El sistema de inventario vincula tu cuenta a una sucursal física. Las compras se despacharán desde el stock de esta sede. Puedes cambiar tu sucursal en cualquier momento.
                    </p>

                    <div style="display:flex; justify-content:space-between; align-items:center; gap:1.5rem; flex-wrap:wrap;
                        background:var(--background-color); padding:1.25rem 1.5rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <div style="width:40px; height:40px; background:#eff6ff; color:#3b82f6;
                                border-radius:50%; display:flex; align-items:center;
                                justify-content:center; font-size:1.2rem; flex-shrink:0;">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                            <div>
                                <p style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);
                                    font-weight:700; margin:0 0 0.15rem 0;">
                                    ${puedeEditarSucursal ? 'Sede de Envío Actual' : 'Sede de Trabajo'}
                                </p>
                                ${sucursalActual
                                    ? `<p style="font-size:1rem; font-weight:700; color:var(--text-main); margin:0;">
                                           ${sucursalActual.nombre}
                                           <span style="font-weight:400; color:var(--text-muted);
                                               font-size:0.85rem;"> · ${sucursalActual.ubicacion}</span>
                                       </p>`
                                    : `<p style="color:#ef4444; font-size:0.9rem; margin:0; font-weight:600;">
                                           Sin sucursal asignada
                                           ${puedeEditarSucursal
                                               ? ' — Elige una para habilitar compras'
                                               : ' — Contacta al administrador'}
                                       </p>`}
                            </div>
                        </div>
                        ${puedeEditarSucursal ? `
                            <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                                <select id="select-sucursal-perfil" class="input-control"
                                    style="padding:0.5rem 0.75rem; font-size:0.9rem; min-width:200px;">
                                    <option value="">— Sin asignar —</option>
                                    ${sucursales.map(s => `
                                        <option value="${s.id}" ${s.id === user.sucursal_id ? 'selected' : ''}>
                                            ${s.nombre} · ${s.ubicacion}
                                        </option>`).join('')}
                                </select>
                                <button id="btn-guardar-sucursal" class="btn btn-primary"
                                    style="padding:0.5rem 1.2rem; font-size:0.9rem;">
                                    <i class="fa-solid fa-floppy-disk"></i> Guardar
                                </button>
                            </div>` : ''}
                    </div>
                </div>
                <div id="sucursal-msg" style="display:none; margin-bottom:1.5rem;"></div>

                <!-- Movimientos de Soles -->
                ${movSoles.length > 0 ? `
                <div style="background:var(--card-bg); border-radius:var(--radius-lg); padding:2rem;
                    box-shadow:var(--shadow-sm); border:1px solid var(--border-color); margin-bottom:2rem;">
                    <h3 style="font-size:1.2rem; margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-coins" style="color:#d97706;"></i> Últimos movimientos de Soles
                    </h3>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        ${movSoles.map(m => `
                            <div style="display:flex; justify-content:space-between; align-items:center;
                                padding:0.75rem 1rem; background:var(--background-color);
                                border-radius:var(--radius-md);">
                                <div>
                                    <span style="font-weight:600; color:var(--text-main);">${m.tipo}</span>
                                    <span style="color:var(--text-muted); font-size:0.8rem; margin-left:0.5rem;">
                                        ${m.fecha ? new Date(m.fecha).toLocaleDateString() : ''}
                                    </span>
                                </div>
                                <span style="font-weight:700; color:${(m.monto ?? 0) < 0 ? '#ef4444' : '#16a34a'};">
                                    ${(m.monto ?? 0) < 0 ? '' : '+'}${m.monto ?? 0} Soles
                                </span>
                            </div>`).join('')}
                    </div>
                </div>` : ''}

                <!-- Historial de pedidos -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="font-size:1.5rem;">
                        <i class="fa-solid fa-box" style="margin-right:0.5rem;"></i>Historial de Pedidos
                    </h3>
                    <button id="btn-logout" class="btn btn-outline"
                        style="color:#ef4444; border-color:#fecaca; background:#fef2f2;">
                        <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                    </button>
                </div>

                <div style="background:var(--card-bg); border-radius:var(--radius-lg);
                    box-shadow:var(--shadow-md); border:1px solid var(--border-color); overflow:hidden;">
                    ${misPedidos.length === 0
                        ? `<div style="padding:4rem; text-align:center;">
                               <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;">📦</div>
                               <h4 style="color:var(--text-main); margin-bottom:0.5rem;">Aún no tienes pedidos</h4>
                               <p style="color:var(--text-muted); margin-bottom:1.5rem;">
                                   Cuando realices una compra aparecerá aquí.
                               </p>
                               <a href="#/inventario" class="btn btn-primary">Ir a comprar</a>
                           </div>`
                        : `<div style="overflow-x:auto;">
                               <table class="table-admin">
                                   <thead><tr>
                                       <th>ID</th><th>Sucursal</th><th>Fecha</th>
                                       <th>Estado</th><th style="text-align:right;">Total</th>
                                   </tr></thead>
                                   <tbody>
                                       ${misPedidos.map(p => `
                                           <tr>
                                               <td style="font-weight:600;">#${p.id.toString().padStart(5,'0')}</td>
                                               <td style="color:var(--text-muted); font-size:0.9rem;">
                                                   <i class="fa-solid fa-location-dot"
                                                       style="color:var(--primary-color); font-size:0.75rem;"></i>
                                                   ${p.sucursales?.nombre || '—'}
                                               </td>
                                               <td style="color:var(--text-muted);">
                                                   ${p.fecha ? new Date(p.fecha).toLocaleDateString() : '—'}
                                               </td>
                                               <td>${estadoBadge(p.estado)}</td>
                                               <td style="font-weight:800; font-size:1.1rem;
                                                   color:var(--primary-color); text-align:right;">
                                                   S/. ${p.total}
                                               </td>
                                           </tr>`).join('')}
                                   </tbody>
                                </table>
                           </div>`}
                </div>
            </div>
        `;

        // ── Guardar sucursal (solo cliente) ──
        document.getElementById('btn-guardar-sucursal')?.addEventListener('click', async () => {
            const select = document.getElementById('select-sucursal-perfil');
            const msgEl  = document.getElementById('sucursal-msg');
            const btn    = document.getElementById('btn-guardar-sucursal');
            const sucId  = select.value ? parseInt(select.value) : null;
            try {
                btn.disabled    = true;
                btn.textContent = 'Guardando...';
                const updated = await actualizarMiSucursal(user.id, sucId);
                guardarUsuarioLocal({ ...user, sucursal_id: updated.sucursal_id });
                msgEl.innerHTML     = `<div class="alert-success"><i class="fa-solid fa-circle-check"></i> Sucursal actualizada.</div>`;
                msgEl.style.display = 'block';
                setTimeout(() => { msgEl.style.display = 'none'; }, 3000);
            } catch (err) {
                msgEl.innerHTML     = `<div class="alert-error">${err.message}</div>`;
                msgEl.style.display = 'block';
            } finally {
                btn.disabled  = false;
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
            }
        });

        // ── Logout ──
        document.getElementById('btn-logout').addEventListener('click', async () => {
            await cerrarSesion();
            window.dispatchEvent(new Event('user-updated'));
            window.dispatchEvent(new Event('cart-updated'));
            window.location.hash = '#/home';
        });

    } catch (error) {
        console.error('Error cargando perfil:', error);
        container.innerHTML = errorState(error.message);
    }
};
