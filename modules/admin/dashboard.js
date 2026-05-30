// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dashboard Admin — Gestión completa por sucursal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal } from '../autenticacion/authService.js';
import { obtenerTodosLosUsuarios, obtenerTodosLosPedidos } from '../../services/usuarioService.js';
import {
    obtenerProductosConInventario, obtenerMovimientosInventario,
    obtenerCategorias, obtenerProveedores,
    crearProducto, crearRegistroInventario
} from '../../services/productosService.js';
import { obtenerSucursales, crearSucursal, eliminarSucursal } from '../../services/sucursalesService.js';
import { spinner, errorState, estadoBadge } from '../../ui/components.js';
import { apiCall } from '../middleware/index.js';
import { supabase } from '../supabaseClient.js';

export const renderDashboardAdmin = async (container) => {
    const user = obtenerUsuarioLocal();
    if (!user || user.rol_id !== 2) { window.location.hash = '#/home'; return; }
    container.innerHTML = spinner('Cargando panel de administración...');

    try {
        const html = await fetch('/templates/admin-dashboard.html').then(r => r.text());
        container.innerHTML = html;

        // Cargar datos
        const [usuarios, productos, pedidos, movimientos, sucursales, categorias, proveedores] =
            await Promise.all([
                obtenerTodosLosUsuarios(),
                obtenerProductosConInventario(),
                obtenerTodosLosPedidos(),
                obtenerMovimientosInventario(50),
                obtenerSucursales(),
                obtenerCategorias(),
                obtenerProveedores()
            ]);

        const totalVentas = pedidos.reduce((a, p) => a + (p.total || 0), 0);
        const miSuc       = sucursales.find(s => s.id === user.sucursal_id);
        const sucMap       = Object.fromEntries(sucursales.map(s => [s.id, s]));

        document.getElementById('admin-bienvenida').innerHTML =
            `Bienvenido, ${user.nombre} ${miSuc
                ? `<span style="color:var(--text-muted);font-size:0.9rem;">· <i class="fa-solid fa-location-dot" style="color:var(--primary-color);"></i> ${miSuc.nombre}</span>`
                : '<span style="color:#ef4444;font-size:0.9rem;">(Sin sede asignada en tu Perfil)</span>'}`;
        
        document.getElementById('stat-usuarios').textContent  = usuarios.length;
        document.getElementById('stat-productos').textContent = productos.length;
        document.getElementById('stat-pedidos').textContent   = pedidos.length;
        document.getElementById('stat-ventas').textContent    = `S/. ${totalVentas}`;

        const tc = document.getElementById('admin-tab-content');
        const rolLabel = ['','Cliente','Admin','Proveedor'];

        const tabs = {
            // ━━━ TAB: USUARIOS (Con Buscador y Filtro de Rol) ━━━
            usuarios: () => {
                const renderLista = (query = '', rolFilter = 'Todos') => {
                    let filtered = usuarios;
                    if (query) {
                        const q = query.toLowerCase();
                        filtered = filtered.filter(u => 
                            (u.nombre && u.nombre.toLowerCase().includes(q)) || 
                            (u.email && u.email.toLowerCase().includes(q))
                        );
                    }
                    if (rolFilter !== 'Todos') {
                        const rolId = parseInt(rolFilter);
                        filtered = filtered.filter(u => u.rol_id === rolId);
                    }

                    const tbody = document.getElementById('admin-usuarios-tbody');
                    if (!tbody) return;

                    tbody.innerHTML = filtered.map(u => {
                        const suc = sucMap[u.sucursal_id];
                        const sucText = suc
                            ? `<span style="display:inline-flex;align-items:center;gap:0.3rem;"><i class="fa-solid fa-location-dot" style="color:var(--primary-color);font-size:0.75rem;"></i><strong>${suc.nombre}</strong></span>`
                            : '<span style="color:var(--text-muted);font-style:italic;">Sin asignar</span>';
                        return `<tr>
                            <td style="color:var(--text-muted);">${u.id}</td>
                            <td style="font-weight:600;">${u.nombre||'—'}</td>
                            <td style="color:var(--text-muted);font-size:0.85rem;">${u.email}</td>
                            <td><span style="font-weight: 500; font-size:0.85rem;">${rolLabel[u.rol_id]||'—'}</span></td>
                            <td>${sucText}</td>
                            <td style="text-align:right;font-weight:700;color:var(--primary-color);">S/. ${u.soles??0}</td>
                        </tr>`;
                    }).join('');
                };

                tc.innerHTML = `
                    <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; background: var(--background-color);">
                        <div style="flex: 1; min-width: 250px; position: relative;">
                            <input id="usr-search" class="input-control" placeholder="Buscar usuario por nombre o email..." style="width: 100%; padding-left: 2rem;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                        </div>
                        <div style="width: 180px;">
                            <select id="usr-rol-filter" class="input-control" style="width:100%;">
                                <option value="Todos">Todos los roles</option>
                                <option value="1">Clientes</option>
                                <option value="2">Administradores</option>
                                <option value="3">Proveedores</option>
                            </select>
                        </div>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Sucursal</th><th style="text-align:right;">Saldo</th></tr></thead>
                            <tbody id="admin-usuarios-tbody"></tbody>
                        </table>
                    </div>
                `;

                renderLista();

                // Listeners
                document.getElementById('usr-search').addEventListener('input', e => {
                    renderLista(e.target.value, document.getElementById('usr-rol-filter').value);
                });
                document.getElementById('usr-rol-filter').addEventListener('change', e => {
                    renderLista(document.getElementById('usr-search').value, e.target.value);
                });
            },

            // ━━━ TAB: PEDIDOS (Con filtro de estado) ━━━
            pedidos: () => {
                const renderLista = (estadoFilter = 'Todos') => {
                    let filtered = pedidos;
                    if (estadoFilter !== 'Todos') {
                        filtered = filtered.filter(p => p.estado === estadoFilter);
                    }

                    const tbody = document.getElementById('admin-pedidos-tbody');
                    if (!tbody) return;

                    if (filtered.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:3rem;color:var(--text-muted);">No hay pedidos en este estado.</td></tr>';
                        return;
                    }

                    tbody.innerHTML = filtered.map(p => {
                        const s = p.sucursales || sucMap[p.sucursal_id];
                        return `<tr>
                            <td style="font-weight:600;">#${p.id.toString().padStart(5,'0')}</td>
                            <td style="color:var(--text-muted);"><i class="fa-solid fa-location-dot" style="color:var(--primary-color);font-size:0.75rem;"></i> ${s?.nombre??'—'}</td>
                            <td>${estadoBadge(p.estado)}</td>
                            <td style="color:var(--text-muted);font-size:0.85rem;">${p.fecha?new Date(p.fecha).toLocaleDateString():'—'}</td>
                            <td style="text-align:right;font-weight:700;color:var(--primary-color);">S/. ${p.total}</td>
                        </tr>`;
                    }).join('');
                };

                tc.innerHTML = `
                    <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-color); background: var(--background-color); display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0;"><i class="fa-solid fa-receipt"></i> Historial de Ventas</h4>
                        <div style="width: 200px;">
                            <select id="ped-estado-filter" class="input-control" style="width:100%;">
                                <option value="Todos">Todos los estados</option>
                                <option value="completado">Completados</option>
                                <option value="pendiente">Pendientes</option>
                                <option value="cancelado">Cancelados</option>
                            </select>
                        </div>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead><tr><th>ID</th><th>Sucursal</th><th>Estado</th><th>Fecha</th><th style="text-align:right;">Total</th></tr></thead>
                            <tbody id="admin-pedidos-tbody"></tbody>
                        </table>
                    </div>
                `;

                renderLista();
                document.getElementById('ped-estado-filter').addEventListener('change', e => renderLista(e.target.value));
            },

            // ━━━ TAB: CATÁLOGO (Gestión Global de Productos) ━━━
            productos: () => {
                const renderLista = (searchVal = '') => {
                    let filtered = productos;
                    if (searchVal) {
                        const q = searchVal.toLowerCase();
                        filtered = filtered.filter(p => 
                            p.nombre.toLowerCase().includes(q) || 
                            p.categoria.toLowerCase().includes(q)
                        );
                    }

                    const tbody = document.getElementById('admin-productos-tbody');
                    if (!tbody) return;

                    tbody.innerHTML = filtered.map(p => `<tr>
                        <td style="width:40px;">${p.imagen_url?`<img src="${p.imagen_url}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;">`:''}</td>
                        <td style="font-weight:600;">${p.nombre}</td>
                        <td style="color:var(--text-muted);">${p.categoria}</td>
                        <td style="text-align:right;">S/. ${p.precio}</td>
                        <td style="text-align:right;font-weight:700;color:${p.stock_total>0?'var(--primary-color)':'#ef4444'};">${p.stock_total} u.</td>
                    </tr>`).join('');
                };

                tc.innerHTML = `
                    <div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border-color);background:var(--background-color);">
                        <h4 style="margin-bottom:1rem;color:var(--text-main);"><i class="fa-solid fa-plus-circle" style="color:var(--primary-color);"></i> Registrar Nuevo Producto en el Catálogo</h4>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem;">
                            <div class="input-group" style="margin:0;"><label>Nombre</label><input id="np-nombre" class="input-control" placeholder="Bujía Bosch"></div>
                            <div class="input-group" style="margin:0;"><label>Precio (S/.)</label><input id="np-precio" type="number" class="input-control" placeholder="25" min="1"></div>
                            <div class="input-group" style="margin:0;"><label>Categoría</label>
                                <select id="np-cat" class="input-control"><option value="">— Seleccionar —</option>
                                ${categorias.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}</select></div>
                            <div class="input-group" style="margin:0;"><label>Proveedor</label>
                                <select id="np-prov" class="input-control"><option value="">— Seleccionar —</option>
                                ${proveedores.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join('')}</select></div>
                            <div class="input-group" style="margin:0;grid-column:1/-1;"><label>URL de Imagen</label><input id="np-img" class="input-control" placeholder="https://ejemplo.com/imagen.jpg"></div>
                            <div class="input-group" style="margin:0;grid-column:1/-1;"><label>Descripción</label><textarea id="np-desc" class="input-control" rows="2" placeholder="Descripción breve..." style="resize:vertical;font-family:var(--font-family);"></textarea></div>
                        </div>
                        <div style="margin-top:1.25rem;display:flex;gap:1rem;align-items:center;">
                            <button id="btn-crear-prod" class="btn btn-primary"><i class="fa-solid fa-check"></i> Registrar Producto</button>
                            <span id="np-msg" style="font-size:0.85rem;"></span>
                        </div>
                    </div>
                    <div style="padding: 1rem 2rem; border-bottom: 1px solid var(--border-color); background: #f8fafc; position:relative;">
                        <input id="prod-search" class="input-control" placeholder="Buscar por nombre o categoría..." style="width: 100%; padding-left: 2rem;">
                        <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 2.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead><tr><th></th><th>Producto</th><th>Categoría</th><th style="text-align:right;">Precio Base</th><th style="text-align:right;">Stock Global</th></tr></thead>
                            <tbody id="admin-productos-tbody"></tbody>
                        </table>
                    </div>
                `;

                renderLista();

                document.getElementById('prod-search').addEventListener('input', e => renderLista(e.target.value));

                document.getElementById('btn-crear-prod')?.addEventListener('click', async () => {
                    const msg=document.getElementById('np-msg'), btn=document.getElementById('btn-crear-prod');
                    const nombre=document.getElementById('np-nombre').value.trim();
                    const precio=parseFloat(document.getElementById('np-precio').value);
                    const cat=parseInt(document.getElementById('np-cat').value);
                    const prov=parseInt(document.getElementById('np-prov').value);
                    const img=document.getElementById('np-img').value.trim();
                    const desc=document.getElementById('np-desc').value.trim();
                    if(!nombre||isNaN(precio)||!cat||!prov){msg.innerHTML='<span style="color:#ef4444;">Completa nombre, precio, categoría y proveedor.</span>';return;}
                    try{btn.disabled=true;btn.textContent='Creando...';
                        await crearProducto({nombre,descripcion:desc,precio,categoria_id:cat,proveedor_id:prov,imagen_url:img});
                        msg.innerHTML='<span style="color:#16a34a;"><i class="fa-solid fa-check"></i> Producto creado con éxito.</span>';
                        ['np-nombre','np-precio','np-img','np-desc'].forEach(id=>document.getElementById(id).value='');
                        setTimeout(() => renderDashboardAdmin(container), 1000);
                    }catch(err){msg.innerHTML=`<span style="color:#ef4444;">${err.message}</span>`;}
                    finally{btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-check"></i> Registrar Producto';}
                });
            },

            // ━━━ TAB: INVENTARIO LOCAL (Gestión de su sucursal) ━━━
            inventario: () => {
                if (!user.sucursal_id) {
                    tc.innerHTML = `
                        <div style="padding: 4rem; text-align: center;">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:#d97706; margin-bottom:1rem;"></i>
                            <h3>No tienes sede asignada</h3>
                            <p style="color:var(--text-muted); max-width: 500px; margin: 0 auto 1.5rem auto;">
                                Debes vincular tu cuenta de Administrador a una sucursal en tu sección de Perfil para poder gestionar el inventario y promociones locales.
                            </p>
                            <a href="#/perfil" class="btn btn-outline">Ir a mi Perfil</a>
                        </div>
                    `;
                    return;
                }

                // Filtrar productos de esta sucursal
                const misProductosInv = productos.flatMap(p => 
                    p.inventario.filter(inv => inv.sucursal_id === user.sucursal_id).map(inv => ({
                        producto: p,
                        invId: inv.id,
                        stock: inv.stock,
                        enOferta: p.inventario.find(i => i.id === inv.id)?.en_oferta || false,
                        precioOferta: p.inventario.find(i => i.id === inv.id)?.precio_oferta || null
                    }))
                );

                // Productos que no están asignados en esta sede
                const productosNoAsignados = productos.filter(p => 
                    !p.inventario.some(inv => inv.sucursal_id === user.sucursal_id)
                );

                tc.innerHTML = `
                    <div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border-color);background:var(--background-color);">
                        <h4 style="margin-bottom:0.25rem;"><i class="fa-solid fa-shop" style="color:var(--primary-color);"></i> Inventario Sede: ${miSuc.nombre}</h4>
                        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;">Agrega productos del catálogo global a tu inventario local.</p>
                        
                        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap;">
                            <div class="input-group" style="margin:0;flex:2;min-width:200px;"><label>Seleccionar Producto</label>
                                <select id="inv-prod" class="input-control"><option value="">— Elegir producto del catálogo —</option>
                                ${productosNoAsignados.map(p=>`<option value="${p.id}">${p.nombre} (Base: S/. ${p.precio})</option>`).join('')}</select>
                            </div>
                            <div class="input-group" style="margin:0;width:120px;"><label>Stock Inicial</label>
                                <input id="inv-stock" type="number" class="input-control" value="0" min="0">
                            </div>
                            <button id="btn-asignar-inv" class="btn btn-primary" style="white-space:nowrap;"><i class="fa-solid fa-plus"></i> Vincular a Sede</button>
                        </div>
                        <div id="inv-msg" style="margin-top:0.75rem;font-size:0.85rem;"></div>
                    </div>

                    <div style="overflow-x:auto;">
                        <table class="table-admin">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Stock</th>
                                    <th>Estado Oferta</th>
                                    <th>Precio Oferta (S/.)</th>
                                    <th style="text-align:center;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${misProductosInv.map(item => `
                                    <tr data-invid="${item.invId}">
                                        <td style="font-weight:600; font-size:1.05rem;">
                                            ${item.producto.nombre}
                                            <span style="display:block; font-size:0.8rem; font-weight:normal; color:var(--text-muted);">
                                                Precio Base: S/. ${item.producto.precio} · Categoria: ${item.producto.categoria}
                                            </span>
                                        </td>
                                        <td>
                                            <input type="number" class="local-stock-input input-control" value="${item.stock}" min="0" style="width:80px; padding:0.4rem; font-size:0.9rem;">
                                        </td>
                                        <td>
                                            <label style="display:inline-flex; align-items:center; gap:0.4rem; cursor:pointer;">
                                                <input type="checkbox" class="local-oferta-chk" ${item.enOferta ? 'checked' : ''}> En Oferta
                                            </label>
                                        </td>
                                        <td>
                                            <input type="number" class="local-precio-oferta input-control" value="${item.precioOferta !== null ? item.precioOferta : ''}" placeholder="Ej: 15" min="1" style="width:80px; padding:0.4rem; font-size:0.9rem;" ${!item.enOferta ? 'disabled' : ''}>
                                        </td>
                                        <td style="text-align:center; display:flex; justify-content:center; gap:0.5rem; align-items:center;">
                                            <button class="btn btn-primary btn-save-local" data-invid="${item.invId}" data-prodid="${item.producto.id}" style="padding: 0.4rem 0.8rem; font-size:0.85rem;"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
                                            <button class="btn btn-outline btn-del-local" data-invid="${item.invId}" style="padding: 0.4rem 0.8rem; color:#ef4444; border-color:#fecaca; font-size:0.85rem;"><i class="fa-solid fa-trash"></i> Retirar</button>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="5" style="text-align:center;padding:3rem;color:var(--text-muted);">No hay productos en esta sucursal. Asigna algunos desde el selector superior.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;

                // Vincular producto
                document.getElementById('btn-asignar-inv')?.addEventListener('click', async () => {
                    const msg=document.getElementById('inv-msg'), btn=document.getElementById('btn-asignar-inv');
                    const pid=parseInt(document.getElementById('inv-prod').value);
                    const stock=parseInt(document.getElementById('inv-stock').value)||0;
                    if(!pid){msg.innerHTML='<span style="color:#ef4444;">Selecciona un producto del catálogo global.</span>';return;}
                    try {
                        btn.disabled=true; btn.textContent='Vinculando...';
                        await crearRegistroInventario(pid, user.sucursal_id, stock);
                        msg.innerHTML='<span style="color:#16a34a;"><i class="fa-solid fa-check"></i> Producto vinculado a la sucursal.</span>';
                        setTimeout(() => renderDashboardAdmin(container), 1000);
                    } catch(err) {
                        msg.innerHTML=`<span style="color:#ef4444;">${err.message}</span>`;
                    } finally {
                        btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-plus"></i> Vincular a Sede';
                    }
                });

                // Activar/desactivar input de precio de oferta
                document.querySelectorAll('.local-oferta-chk').forEach(chk => {
                    chk.addEventListener('change', e => {
                        const tr = e.target.closest('tr');
                        const pInput = tr.querySelector('.local-precio-oferta');
                        pInput.disabled = !e.target.checked;
                    });
                });

                // Guardar cambios en el inventario local
                document.querySelectorAll('.btn-save-local').forEach(btn => {
                    btn.addEventListener('click', async e => {
                        const target = e.currentTarget;
                        const invId = parseInt(target.dataset.invid);
                        const prodId = parseInt(target.dataset.prodid);
                        const tr = target.closest('tr');
                        
                        const newStock = parseInt(tr.querySelector('.local-stock-input').value);
                        const enOferta = tr.querySelector('.local-oferta-chk').checked;
                        const precioOferVal = parseFloat(tr.querySelector('.local-precio-oferta').value);

                        if (isNaN(newStock) || newStock < 0) {
                            alert('El stock no puede ser negativo.'); return;
                        }
                        if (enOferta && (isNaN(precioOferVal) || precioOferVal <= 0)) {
                            alert('Define un precio de oferta válido y mayor a cero.'); return;
                        }

                        try {
                            target.disabled = true;
                            target.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                            // Registrar movimiento si el stock cambió
                            const { data: invCurrent } = await supabase.from('inventario').select('stock').eq('id', invId).single();
                            const currentStock = invCurrent.stock || 0;
                            const diff = newStock - currentStock;

                            await apiCall('inventario:update', {
                                data: {
                                    stock: newStock,
                                    en_oferta: enOferta,
                                    precio_oferta: enOferta ? precioOferVal : null
                                },
                                filter: { id: invId }
                            });

                            if (diff !== 0) {
                                await supabase.from('movimientos_inventario').insert([{
                                    producto_id: prodId,
                                    sucursal_id: user.sucursal_id,
                                    tipo: diff > 0 ? 'entrada' : 'salida',
                                    cantidad: Math.abs(diff)
                                }]);
                            }

                            target.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                            target.style.background = '#16a34a';
                            setTimeout(() => {
                                target.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
                                target.style.background = '';
                                target.disabled = false;
                            }, 1500);

                        } catch(err) {
                            alert(err.message);
                            target.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
                            target.disabled = false;
                        }
                    });
                });

                // Eliminar producto de la sucursal
                document.querySelectorAll('.btn-del-local').forEach(btn => {
                    btn.addEventListener('click', async e => {
                        const invId = parseInt(e.currentTarget.dataset.invid);
                        if (!confirm('¿Seguro que deseas retirar este producto de tu sucursal? El inventario registrado se perderá.')) return;
                        try {
                            e.currentTarget.disabled = true;
                            await apiCall('inventario:delete', { filter: { id: invId } });
                            e.target.closest('tr').remove();
                        } catch(err) {
                            alert(err.message);
                            e.currentTarget.disabled = false;
                        }
                    });
                });
            },

            // ━━━ TAB: SOLICITUDES DE ABASTECIMIENTO DE PROVEEDORES ━━━
            solicitudes: async () => {
                if (!user.sucursal_id) {
                    tc.innerHTML = '<p style="padding:3rem;text-align:center;color:var(--text-muted);">Asigna una sucursal en tu perfil primero.</p>';
                    return;
                }

                tc.innerHTML = spinner('Cargando solicitudes...');

                try {
                    // Consultar solicitudes para la sucursal del administrador
                    const data = await apiCall('solicitudes_entrega:select', {
                        select: '*, usuarios(nombre, email), productos(nombre)',
                        filter: { sucursal_id: user.sucursal_id },
                        order: 'id',
                        ascending: false
                    });

                    if (data.length === 0) {
                        tc.innerHTML = '<p style="padding:4rem;text-align:center;color:var(--text-muted);"><i class="fa-solid fa-clipboard-check" style="font-size:2.5rem;margin-bottom:1rem;display:block;opacity:0.6;"></i>No hay solicitudes de entrega registradas en tu sede.</p>';
                        return;
                    }

                    tc.innerHTML = `
                        <div style="padding:1.25rem; border-bottom:1px solid var(--border-color); background:var(--background-color);">
                            <h4 style="margin:0;"><i class="fa-solid fa-clipboard-list"></i> Solicitudes de Abastecimiento</h4>
                        </div>
                        <div style="overflow-x:auto;">
                            <table class="table-admin">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Proveedor</th>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Estado</th>
                                        <th style="text-align:center;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.map(s => {
                                        const dateStr = s.fecha ? new Date(s.fecha).toLocaleDateString() : '—';
                                        let badgeColor = '#fef3c7'; let textColor = '#d97706';
                                        if (s.estado === 'aprobado') { badgeColor = '#dcfce7'; textColor = '#16a34a'; }
                                        if (s.estado === 'rechazado') { badgeColor = '#fee2e2'; textColor = '#ef4444'; }

                                        const isPendiente = s.estado === 'pendiente';

                                        return `
                                            <tr>
                                                <td style="color:var(--text-muted); font-size:0.85rem;">${dateStr}</td>
                                                <td>
                                                    <strong>${s.usuarios?.nombre || 'Proveedor'}</strong>
                                                    <span style="display:block;font-size:0.75rem;color:var(--text-muted);">${s.usuarios?.email || ''}</span>
                                                </td>
                                                <td style="font-weight:600;">${s.productos?.nombre || '—'}</td>
                                                <td style="font-weight:700;color:var(--primary-color);">${s.cantidad} unidades</td>
                                                <td>
                                                    <span style="background:${badgeColor}; color:${textColor}; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">
                                                        ${s.estado}
                                                    </span>
                                                </td>
                                                <td style="text-align:center;">
                                                    ${isPendiente ? `
                                                        <div style="display:inline-flex; gap:0.4rem;">
                                                            <button class="btn btn-primary btn-aprobar-sol" data-id="${s.id}" data-prodid="${s.producto_id}" data-cant="${s.cantidad}" style="padding: 0.35rem 0.75rem; font-size:0.8rem;"><i class="fa-solid fa-check"></i> Aprobar</button>
                                                            <button class="btn btn-outline btn-rechazar-sol" data-id="${s.id}" style="padding: 0.35rem 0.75rem; color:#ef4444; border-color:#fecaca; font-size:0.8rem;"><i class="fa-solid fa-xmark"></i> Rechazar</button>
                                                        </div>
                                                    ` : `<span style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-circle-info"></i> Procesado</span>`}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;

                    // Aprobar Solicitud
                    document.querySelectorAll('.btn-aprobar-sol').forEach(btn => {
                        btn.addEventListener('click', async e => {
                            const target = e.currentTarget;
                            const solId = parseInt(target.dataset.id);
                            const prodId = parseInt(target.dataset.prodid);
                            const cant = parseInt(target.dataset.cant);

                            if (!confirm(`¿Aprobar ingreso de ${cant} unidades al stock de tu sucursal?`)) return;

                            try {
                                target.disabled = true;
                                target.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                                // 1. Cambiar estado en solicitudes_entrega
                                await apiCall('solicitudes_entrega:update', {
                                    data: { estado: 'aprobado' },
                                    filter: { id: solId }
                                });

                                // 2. Actualizar stock en public.inventario
                                const { data: currentInv } = await supabase
                                    .from('inventario')
                                    .select('id, stock')
                                    .eq('producto_id', prodId)
                                    .eq('sucursal_id', user.sucursal_id)
                                    .maybeSingle();

                                if (currentInv) {
                                    await apiCall('inventario:update', {
                                        data: { stock: (currentInv.stock || 0) + cant },
                                        filter: { id: currentInv.id }
                                    });
                                } else {
                                    // Crear registro inicial de inventario en la sede si no existe
                                    await supabase.from('inventario').insert([{
                                        producto_id: prodId,
                                        sucursal_id: user.sucursal_id,
                                        stock: cant
                                    }]);
                                }

                                // 3. Registrar movimiento de inventario
                                await supabase.from('movimientos_inventario').insert([{
                                    producto_id: prodId,
                                    sucursal_id: user.sucursal_id,
                                    tipo: 'entrada',
                                    cantidad: cant
                                }]);

                                tabs.solicitudes(); // Recargar

                            } catch(err) {
                                alert(err.message);
                                target.disabled = false;
                                target.innerHTML = '<i class="fa-solid fa-check"></i> Aprobar';
                            }
                        });
                    });

                    // Rechazar Solicitud
                    document.querySelectorAll('.btn-rechazar-sol').forEach(btn => {
                        btn.addEventListener('click', async e => {
                            const target = e.currentTarget;
                            const solId = parseInt(target.dataset.id);

                            if (!confirm('¿Rechazar esta solicitud de entrega?')) return;

                            try {
                                target.disabled = true;
                                target.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                                await apiCall('solicitudes_entrega:update', {
                                    data: { estado: 'rechazado' },
                                    filter: { id: solId }
                                });

                                tabs.solicitudes();

                            } catch(err) {
                                alert(err.message);
                                target.disabled = false;
                                target.innerHTML = '<i class="fa-solid fa-xmark"></i> Rechazar';
                            }
                        });
                    });

                } catch(err) {
                    tc.innerHTML = errorState(err.message);
                }
            },

            // ━━━ TAB: HISTORIAL SEDE (Movimientos de inventario local) ━━━
            movimientos: () => {
                const localMovs = movimientos.filter(m => m.sucursal_id === user.sucursal_id);

                if (localMovs.length === 0) {
                    tc.innerHTML = `
                        <div style="padding:4rem;text-align:center;">
                            <i class="fa-solid fa-clock-rotate-left" style="font-size:2.5rem;color:var(--text-muted);margin-bottom:1rem;display:block;opacity:0.6;"></i>
                            <p style="color:var(--text-muted);margin:0;">Sin movimientos de inventario registrados en tu sede.</p>
                        </div>`;
                    return;
                }
                tc.innerHTML = `
                    <div style="padding:1.25rem; border-bottom:1px solid var(--border-color); background:var(--background-color);">
                        <h4 style="margin:0;"><i class="fa-solid fa-clock-rotate-left"></i> Historial de Movimientos de la Sede</h4>
                    </div>
                    <table class="table-admin">
                        <thead><tr><th>Producto</th><th>Tipo</th><th>Fecha</th><th style="text-align:right;">Cant.</th></tr></thead>
                        <tbody>${localMovs.map(m => `
                            <tr>
                                <td style="font-weight:600;">${m.productos?.nombre||'—'}</td>
                                <td style="color:${m.tipo==='entrada'?'#16a34a':'#ef4444'};font-weight:600;">${m.tipo}</td>
                                <td style="color:var(--text-muted);font-size:0.85rem;">${m.fecha?new Date(m.fecha).toLocaleDateString():'—'}</td>
                                <td style="text-align:right;font-weight:700;color:${m.tipo==='entrada'?'#16a34a':'#ef4444'};">${m.tipo==='entrada'?'+':'−'}${m.cantidad}</td>
                            </tr>
                        `).join('')}</tbody>
                    </table>`;
            },

            // ━━━ TAB: SUCURSALES CRUD ━━━
            sucursales: () => {
                tc.innerHTML=`
                    <div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border-color);background:var(--background-color);">
                        <h4 style="margin-bottom:1rem;color:var(--text-main);"><i class="fa-solid fa-plus" style="color:var(--primary-color);"></i> Registrar Nueva Sucursal</h4>
                        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap;">
                            <div class="input-group" style="margin:0;flex:1;min-width:180px;"><label>Nombre</label><input id="suc-nombre" class="input-control" placeholder="Sede Sur"></div>
                            <div class="input-group" style="margin:0;flex:1;min-width:180px;"><label>Ubicación</label><input id="suc-ubicacion" class="input-control" placeholder="Lima"></div>
                            <button id="btn-crear-suc" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Agregar</button>
                        </div>
                        <div id="suc-error" class="alert-error" style="display:none;margin-top:0.75rem;"></div>
                    </div>
                    ${sucursales.length===0
                        ? '<div style="padding:3rem;text-align:center;"><p style="color:var(--text-muted);">No hay sucursales registradas.</p></div>'
                        : `<div style="overflow-x:auto;"><table class="table-admin" id="tabla-suc"><thead><tr><th>ID</th><th>Nombre</th><th>Ubicación</th><th style="text-align:center;">Acciones</th></tr></thead>
                            <tbody>${sucursales.map(s=>`<tr data-sid="${s.id}">
                                <td style="color:var(--text-muted);">${s.id}</td>
                                <td style="font-weight:600;">${s.nombre}</td>
                                <td style="color:var(--text-muted);">${s.ubicacion}</td>
                                <td style="text-align:center;"><button class="btn-del-suc" data-id="${s.id}" style="background:#fee2e2;border:none;color:#ef4444;cursor:pointer;padding:0.4rem 0.8rem;border-radius:var(--radius-md);font-size:0.85rem;font-weight:600;font-family:var(--font-family);"><i class="fa-solid fa-trash"></i> Eliminar</button></td>
                            </tr>`).join('')}</tbody></table></div>`}`;

                // Crear sucursal
                document.getElementById('btn-crear-suc')?.addEventListener('click', async()=>{
                    const n=document.getElementById('suc-nombre').value.trim();
                    const u=document.getElementById('suc-ubicacion').value.trim();
                    const err=document.getElementById('suc-error');
                    const btn=document.getElementById('btn-crear-suc');
                    err.style.display='none';
                    if(!n||!u){err.textContent='Completa ambos campos.';err.style.display='block';return;}
                    try{btn.disabled=true;btn.textContent='Guardando...';
                        await crearSucursal(n,u);
                        setTimeout(() => renderDashboardAdmin(container), 1000);
                    }catch(e){err.textContent=e.message;err.style.display='block';}
                    finally{btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-plus"></i> Agregar';}
                });

                // Eliminar sucursal
                document.querySelectorAll('.btn-del-suc').forEach(b=>b.addEventListener('click', async e=>{
                    const id=parseInt(e.currentTarget.dataset.id);
                    if(!confirm('¿Eliminar esta sucursal?'))return;
                    try{e.currentTarget.disabled=true;e.currentTarget.textContent='...';
                        await eliminarSucursal(id);
                        document.querySelector(`tr[data-sid="${id}"]`)?.remove();
                    }catch(err){alert(err.message);e.currentTarget.disabled=false;e.currentTarget.innerHTML='<i class="fa-solid fa-trash"></i> Eliminar';}
                }));
            }
        };

        tabs.usuarios();
        document.querySelectorAll('.admin-tab').forEach(t=>t.addEventListener('click',e=>{
            document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const name=e.currentTarget.dataset.tab;
            if(tabs[name])tabs[name]();
        }));

    } catch(error) {
        console.error('Error en dashboard admin:', error);
        container.innerHTML = errorState(error.message);
    }
};