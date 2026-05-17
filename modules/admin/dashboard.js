// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dashboard Admin — Gestión completa
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal } from '../autenticacion/authService.js';
import { obtenerTodosLosUsuarios, obtenerTodosLosPedidos, asignarSucursalAUsuario } from '../../services/usuarioService.js';
import {
    obtenerProductosConInventario, obtenerMovimientosInventario,
    obtenerCategorias, obtenerProveedores,
    crearProducto, crearRegistroInventario
} from '../../services/productosService.js';
import { obtenerSucursales, crearSucursal, eliminarSucursal } from '../../services/sucursalesService.js';
import { spinner, errorState } from '../../ui/components.js';

export const renderDashboardAdmin = async (container) => {
    const user = obtenerUsuarioLocal();
    if (!user || user.rol_id !== 2) { window.location.hash = '#/home'; return; }
    container.innerHTML = spinner('Cargando dashboard...');

    try {
        const html = await fetch('/templates/admin-dashboard.html').then(r => r.text());
        container.innerHTML = html;

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
                : ''}`;
        document.getElementById('stat-usuarios').textContent  = usuarios.length;
        document.getElementById('stat-productos').textContent = productos.length;
        document.getElementById('stat-pedidos').textContent   = pedidos.length;
        document.getElementById('stat-ventas').textContent    = `$ ${totalVentas}`;

        const tc = document.getElementById('admin-tab-content');
        const rolLabel = ['','Cliente','Admin','Proveedor'];

        const tabs = {
            // ━━━ USUARIOS: sucursal como TEXTO ━━━
            usuarios: () => {
                tc.innerHTML = `<div style="overflow-x:auto;"><table class="table-admin">
                    <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Sucursal</th><th style="text-align:right;">Zoles</th></tr></thead>
                    <tbody>${usuarios.map(u => {
                        const suc = sucMap[u.sucursal_id];
                        const sucText = suc
                            ? `<span style="display:inline-flex;align-items:center;gap:0.3rem;"><i class="fa-solid fa-location-dot" style="color:var(--primary-color);font-size:0.75rem;"></i><strong>${suc.nombre}</strong><span style="color:var(--text-muted);font-size:0.8rem;">· ${suc.ubicacion}</span></span>`
                            : '<span style="color:var(--text-muted);font-style:italic;">Sin asignar</span>';
                        return `<tr>
                            <td style="color:var(--text-muted);">${u.id}</td>
                            <td style="font-weight:600;">${u.nombre||'—'}</td>
                            <td style="color:var(--text-muted);font-size:0.85rem;">${u.email}</td>
                            <td>${rolLabel[u.rol_id]||'—'}</td>
                            <td>${sucText}</td>
                            <td style="text-align:right;font-weight:700;color:var(--primary-color);">$ ${u.zoles??0}</td>
                        </tr>`;
                    }).join('')}</tbody></table></div>`;
            },

            pedidos: () => {
                tc.innerHTML = pedidos.length===0
                    ? '<p style="padding:3rem;text-align:center;color:var(--text-muted);">Sin pedidos.</p>'
                    : `<table class="table-admin"><thead><tr><th>ID</th><th>Sucursal</th><th>Estado</th><th>Fecha</th><th style="text-align:right;">Total</th></tr></thead><tbody>
                        ${pedidos.map(p => {
                            const s = p.sucursales || sucMap[p.sucursal_id];
                            return `<tr>
                                <td style="font-weight:600;">#${p.id.toString().padStart(5,'0')}</td>
                                <td style="color:var(--text-muted);"><i class="fa-solid fa-location-dot" style="color:var(--primary-color);font-size:0.75rem;"></i> ${s?.nombre??'—'}</td>
                                <td>${p.estado}</td>
                                <td style="color:var(--text-muted);font-size:0.85rem;">${p.fecha?new Date(p.fecha).toLocaleDateString():'—'}</td>
                                <td style="text-align:right;font-weight:700;color:var(--primary-color);">$ ${p.total} Zoles</td>
                            </tr>`;
                        }).join('')}</tbody></table>`;
            },

            // ━━━ PRODUCTOS: con formulario de creación ━━━
            productos: () => {
                tc.innerHTML = `
                    <div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border-color);background:var(--background-color);">
                        <h4 style="margin-bottom:1rem;"><i class="fa-solid fa-plus" style="color:var(--primary-color);"></i> Nuevo Producto</h4>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                            <div class="input-group" style="margin:0;"><label>Nombre</label><input id="np-nombre" class="input-control" placeholder="Ej: Llave inglesa"></div>
                            <div class="input-group" style="margin:0;"><label>Precio (Zoles)</label><input id="np-precio" type="number" class="input-control" placeholder="100" min="1"></div>
                            <div class="input-group" style="margin:0;"><label>Categoría</label>
                                <select id="np-cat" class="input-control"><option value="">— Seleccionar —</option>
                                ${categorias.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}</select></div>
                            <div class="input-group" style="margin:0;"><label>Proveedor</label>
                                <select id="np-prov" class="input-control"><option value="">— Seleccionar —</option>
                                ${proveedores.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join('')}</select></div>
                            <div class="input-group" style="margin:0;grid-column:1/-1;"><label>URL de Imagen</label><input id="np-img" class="input-control" placeholder="https://ejemplo.com/imagen.jpg"></div>
                            <div class="input-group" style="margin:0;grid-column:1/-1;"><label>Descripción</label><textarea id="np-desc" class="input-control" rows="2" placeholder="Descripción breve..." style="resize:vertical;font-family:var(--font-family);"></textarea></div>
                        </div>
                        <div style="margin-top:1rem;display:flex;gap:1rem;align-items:center;">
                            <button id="btn-crear-prod" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Crear Producto</button>
                            <span id="np-msg" style="font-size:0.85rem;"></span>
                        </div>
                    </div>
                    <table class="table-admin"><thead><tr><th></th><th>Producto</th><th>Categoría</th><th style="text-align:right;">Precio</th><th style="text-align:right;">Stock Total</th></tr></thead>
                    <tbody>${productos.map(p=>`<tr>
                        <td style="width:40px;">${p.imagen_url?`<img src="${p.imagen_url}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;">`:''}</td>
                        <td style="font-weight:600;">${p.nombre}</td>
                        <td style="color:var(--text-muted);">${p.categoria}</td>
                        <td style="text-align:right;">$ ${p.precio} Zoles</td>
                        <td style="text-align:right;font-weight:700;color:${p.stock_total>0?'var(--primary-color)':'#ef4444'};">${p.stock_total}</td>
                    </tr>`).join('')}</tbody></table>`;

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
                        msg.innerHTML='<span style="color:#16a34a;"><i class="fa-solid fa-check"></i> Producto creado.</span>';
                        ['np-nombre','np-precio','np-img','np-desc'].forEach(id=>document.getElementById(id).value='');
                    }catch(err){msg.innerHTML=`<span style="color:#ef4444;">${err.message}</span>`;}
                    finally{btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-plus"></i> Crear Producto';}
                });
            },

            // ━━━ INVENTARIO: asignar productos a sucursales ━━━
            inventario: () => {
                tc.innerHTML = `
                    <div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border-color);background:var(--background-color);">
                        <h4 style="margin-bottom:0.5rem;"><i class="fa-solid fa-warehouse" style="color:var(--primary-color);"></i> Asignar Producto a Sucursal</h4>
                        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;">Un producto solo existe en una sucursal si tiene un registro aquí.</p>
                        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap;">
                            <div class="input-group" style="margin:0;flex:1;min-width:180px;"><label>Producto</label>
                                <select id="inv-prod" class="input-control"><option value="">— Seleccionar —</option>
                                ${productos.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join('')}</select></div>
                            <div class="input-group" style="margin:0;flex:1;min-width:150px;"><label>Sucursal</label>
                                <select id="inv-suc" class="input-control"><option value="">— Seleccionar —</option>
                                ${sucursales.map(s=>`<option value="${s.id}">${s.nombre} · ${s.ubicacion}</option>`).join('')}</select></div>
                            <div class="input-group" style="margin:0;width:100px;"><label>Stock</label>
                                <input id="inv-stock" type="number" class="input-control" value="0" min="0"></div>
                            <button id="btn-asignar-inv" class="btn btn-primary" style="white-space:nowrap;"><i class="fa-solid fa-link"></i> Asignar</button>
                        </div>
                        <div id="inv-msg" style="margin-top:0.75rem;font-size:0.85rem;"></div>
                    </div>
                    <div style="overflow-x:auto;"><table class="table-admin"><thead><tr><th>Producto</th><th>Sucursal</th><th style="text-align:right;">Stock</th></tr></thead>
                    <tbody>${productos.flatMap(p=>p.inventario.map(inv=>`<tr>
                        <td style="font-weight:600;">${p.nombre}</td>
                        <td><i class="fa-solid fa-location-dot" style="color:var(--primary-color);font-size:0.75rem;"></i> ${inv.sucursal_nombre}${inv.sucursal_ubicacion?' · '+inv.sucursal_ubicacion:''}</td>
                        <td style="text-align:right;font-weight:700;color:${inv.stock>0?'var(--primary-color)':'#ef4444'};">${inv.stock}</td>
                    </tr>`)).join('')||'<tr><td colspan="3" style="text-align:center;padding:2rem;color:var(--text-muted);">No hay registros.</td></tr>'}</tbody></table></div>`;

                document.getElementById('btn-asignar-inv')?.addEventListener('click', async()=>{
                    const msg=document.getElementById('inv-msg'),btn=document.getElementById('btn-asignar-inv');
                    const pid=parseInt(document.getElementById('inv-prod').value);
                    const sid=parseInt(document.getElementById('inv-suc').value);
                    const stock=parseInt(document.getElementById('inv-stock').value)||0;
                    if(!pid||!sid){msg.innerHTML='<span style="color:#ef4444;">Selecciona producto y sucursal.</span>';return;}
                    try{btn.disabled=true;btn.textContent='Asignando...';
                        await crearRegistroInventario(pid,sid,stock);
                        msg.innerHTML='<span style="color:#16a34a;"><i class="fa-solid fa-check"></i> Asignado correctamente.</span>';
                    }catch(err){msg.innerHTML=`<span style="color:#ef4444;">${err.message}</span>`;}
                    finally{btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-link"></i> Asignar';}
                });
            },

            // ━━━ MOVIMIENTOS ━━━
            movimientos: () => {
                if(movimientos.length===0){
                    tc.innerHTML=`<div style="padding:3rem;text-align:center;">
                        <p style="color:var(--text-muted);margin-bottom:1rem;">Sin movimientos de inventario.</p>
                        <p style="color:#d97706;font-size:0.85rem;"><i class="fa-solid fa-triangle-exclamation"></i> Si hay datos en Supabase pero no aquí, ejecuta las políticas RLS.</p></div>`;
                    return;
                }
                tc.innerHTML=`<table class="table-admin"><thead><tr><th>Producto</th><th>Sucursal</th><th>Tipo</th><th>Fecha</th><th style="text-align:right;">Cant.</th></tr></thead>
                    <tbody>${movimientos.map(m=>{
                        const s=m.sucursales||sucMap[m.sucursal_id];
                        return `<tr>
                            <td style="font-weight:600;">${m.productos?.nombre||'—'}</td>
                            <td style="color:var(--text-muted);"><i class="fa-solid fa-location-dot" style="color:var(--primary-color);font-size:0.75rem;"></i> ${s?.nombre??'—'}</td>
                            <td style="color:${m.tipo==='entrada'?'#16a34a':'#ef4444'};font-weight:600;">${m.tipo}</td>
                            <td style="color:var(--text-muted);font-size:0.85rem;">${m.fecha?new Date(m.fecha).toLocaleDateString():'—'}</td>
                            <td style="text-align:right;font-weight:700;color:${m.tipo==='entrada'?'#16a34a':'#ef4444'};">${m.tipo==='entrada'?'+':'−'}${m.cantidad}</td>
                        </tr>`;}).join('')}</tbody></table>`;
            },

            // ━━━ SUCURSALES CRUD ━━━
            sucursales: () => {
                tc.innerHTML=`
                    <div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border-color);background:var(--background-color);">
                        <h4 style="margin-bottom:1rem;"><i class="fa-solid fa-plus" style="color:var(--primary-color);"></i> Nueva Sucursal</h4>
                        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap;">
                            <div class="input-group" style="margin:0;flex:1;min-width:180px;"><label>Nombre</label><input id="suc-nombre" class="input-control" placeholder="Sede Sur"></div>
                            <div class="input-group" style="margin:0;flex:1;min-width:180px;"><label>Ubicación</label><input id="suc-ubicacion" class="input-control" placeholder="Lima"></div>
                            <button id="btn-crear-suc" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Agregar</button>
                        </div>
                        <div id="suc-error" class="alert-error" style="display:none;margin-top:0.75rem;"></div>
                    </div>
                    ${sucursales.length===0
                        ? '<div style="padding:3rem;text-align:center;"><p style="color:var(--text-muted);">No hay sucursales registradas.</p><p style="color:#d97706;font-size:0.85rem;margin-top:0.5rem;"><i class="fa-solid fa-triangle-exclamation"></i> Si existen en Supabase pero no aquí, ejecuta las políticas RLS.</p></div>'
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
                        tabs.sucursales(); // recargar tab
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