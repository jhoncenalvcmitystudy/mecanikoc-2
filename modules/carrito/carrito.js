// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Carrito — Checkout automático por sucursal del usuario
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerUsuarioLocal, guardarUsuarioLocal, obtenerUsuarioPorId } from '../autenticacion/authService.js';
import { realizarCompra } from '../../services/carritoService.js';
import { obtenerSucursales } from '../../services/sucursalesService.js';
import { emptyState } from '../../ui/components.js';

export const renderCarrito = async (container) => {
    const user = obtenerUsuarioLocal();

    if (!user) {
        container.innerHTML = emptyState({
            icon: '🔒', title: 'Debes iniciar sesión',
            message: 'Para ver tu carrito y realizar pedidos necesitas una cuenta.',
            actionHref: '#/login', actionLabel: 'Ir al Login'
        });
        return;
    }

    let sucursales = [];
    try { sucursales = await obtenerSucursales(); } catch { /* silencioso */ }

    const render = () => {
        let cart;
        try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); }
        catch { cart = []; localStorage.setItem('cart', '[]'); }

        if (cart.length === 0) {
            container.innerHTML = emptyState({
                icon: '🛒', title: 'Tu carrito está vacío',
                message: 'Aún no has agregado ningún producto.',
                actionHref: '#/inventario', actionLabel: 'Ver Catálogo'
            });
            return;
        }

        const total         = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
        const zolesOk       = user.zoles >= total;
        const tienesSucursal = !!user.sucursal_id;
        const sucursalFija  = sucursales.find(s => s.id === user.sucursal_id);

        // Si el usuario tiene sucursal asignada, no mostramos selector.
        // Si no la tiene, mostramos selector de fallback.
        const mostrarSelector = !tienesSucursal;

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem;">
                <div>
                    <h1 style="font-size:2.5rem; margin-bottom:0.5rem;">Carrito de Compras</h1>
                    <p style="color:var(--text-muted);">Revisa tus productos antes de finalizar la compra.</p>
                </div>
            </div>

            <div class="cart-layout">
                <!-- Items del carrito -->
                <div class="cart-items">
                    ${cart.map((item, idx) => `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <div class="cart-item-img"
                                    ${item.imagen_url
                                        ? `style="background-image:url('${item.imagen_url}');
                                           background-size:cover; background-position:center;"`
                                        : ''}>
                                    ${!item.imagen_url
                                        ? '<span style="font-size:0.7rem;color:var(--text-muted);padding:0.5rem;">[Img]</span>'
                                        : ''}
                                </div>
                                <div>
                                    <div style="font-weight:700; font-size:1.1rem; color:var(--text-main);
                                        margin-bottom:0.25rem;">${item.nombre}</div>
                                    <div style="color:var(--primary-color); font-weight:600;">
                                        $ ${item.precio} Zoles c/u
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:2rem;">
                                <div style="display:flex; border:1px solid var(--border-color);
                                    border-radius:var(--radius-md); overflow:hidden; background:white;">
                                    <button class="btn-qty" data-index="${idx}" data-action="minus"
                                        style="padding:0.5rem 1rem; border:none; background:transparent;
                                               cursor:pointer; font-size:1.2rem;">−</button>
                                    <span style="padding:0.5rem 1rem; border-left:1px solid var(--border-color);
                                        border-right:1px solid var(--border-color); font-weight:600;
                                        min-width:40px; text-align:center;">${item.cantidad}</span>
                                    <button class="btn-qty" data-index="${idx}" data-action="plus"
                                        style="padding:0.5rem 1rem; border:none; background:transparent;
                                               cursor:pointer; font-size:1.2rem;">+</button>
                                </div>
                                <div style="font-weight:800; font-size:1.2rem;
                                    min-width:100px; text-align:right;">
                                    $ ${item.precio * item.cantidad}
                                </div>
                                <button class="btn-remove" data-index="${idx}"
                                    style="background:#fee2e2; border:none; color:#ef4444; cursor:pointer;
                                           width:40px; height:40px; border-radius:50%; display:flex;
                                           align-items:center; justify-content:center; font-size:1.1rem;">🗑</button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Resumen -->
                <div class="cart-summary">
                    <h3 style="font-size:1.25rem; margin-bottom:1.5rem; color:var(--text-main);">
                        Resumen de Compra
                    </h3>

                    <div style="display:flex; justify-content:space-between;
                        margin-bottom:1rem; color:var(--text-muted);">
                        <span>Subtotal (${cart.reduce((a,i) => a+i.cantidad, 0)} artículos)</span>
                        <span>$ ${total} Zoles</span>
                    </div>
                    <div class="cart-total-row">
                        <span>Total a pagar</span>
                        <span style="color:var(--primary-color);">$ ${total} Zoles</span>
                    </div>

                    <!-- Saldo -->
                    <div style="margin-bottom:1.5rem; background:var(--background-color);
                        padding:1rem; border-radius:var(--radius-md);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:var(--text-muted); font-size:0.9rem;">Tu saldo:</span>
                            <strong style="color:${zolesOk ? 'inherit' : '#ef4444'};">
                                $ ${user.zoles} Zoles
                            </strong>
                        </div>
                        <div style="color:${zolesOk ? 'var(--primary-color)' : '#ef4444'};
                            font-size:0.85rem; margin-top:0.5rem; display:flex; gap:0.4rem; align-items:center;">
                            <i class="fa-solid ${zolesOk ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
                            ${zolesOk ? 'Saldo suficiente' : 'Zoles insuficientes'}
                        </div>
                    </div>

                    <!-- Sucursal de retiro -->
                    <div class="input-group" style="margin-bottom:1.5rem;">
                        <label style="display:flex; align-items:center; gap:0.4rem; font-weight:600;">
                            <i class="fa-solid fa-location-dot" style="color:var(--primary-color);"></i>
                            Sucursal de retiro
                        </label>
                        ${tienesSucursal
                            ? `<!-- Sucursal fija del usuario -->
                               <div style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem;
                                   background:var(--background-color); border-radius:var(--radius-md);
                                   border:1px solid var(--border-color);">
                                   <i class="fa-solid fa-check-circle" style="color:var(--primary-color);"></i>
                                   <div>
                                       <p style="font-weight:700; color:var(--text-main); font-size:0.95rem;
                                           margin:0;">${sucursalFija?.nombre ?? 'Sede asignada'}</p>
                                       <p style="color:var(--text-muted); font-size:0.8rem; margin:0;">
                                           ${sucursalFija?.ubicacion ?? ''}
                                       </p>
                                   </div>
                               </div>`
                            : `<!-- Selector si no tiene sucursal asignada -->
                               <select id="sucursal-select" class="input-control">
                                   <option value="">— Selecciona una sucursal —</option>
                                   ${sucursales.map(s =>
                                       `<option value="${s.id}">${s.nombre} · ${s.ubicacion}</option>`
                                   ).join('')}
                               </select>
                               <p style="color:#d97706; font-size:0.8rem; margin-top:0.4rem;">
                                   <i class="fa-solid fa-circle-info"></i>
                                   Puedes asignar tu sucursal permanente desde tu
                                   <a href="#/perfil" style="color:inherit; font-weight:700;">perfil</a>.
                               </p>`}
                    </div>

                    <div id="checkout-error" class="alert-error" style="display:none;"></div>

                    <button id="btn-comprar" class="btn btn-primary"
                        style="width:100%; padding:1rem; font-size:1.1rem;"
                        ${!zolesOk || (!tienesSucursal && sucursales.length === 0) ? 'disabled' : ''}>
                        <i class="fa-solid fa-money-check-dollar"></i> Confirmar y Pagar
                    </button>
                </div>
            </div>
        `;

        // Listeners cantidad
        container.querySelectorAll('.btn-qty').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.currentTarget.dataset.index);
                e.currentTarget.dataset.action === 'plus'
                    ? cart[idx].cantidad++
                    : cart[idx].cantidad > 1 && cart[idx].cantidad--;
                localStorage.setItem('cart', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart-updated'));
                render();
            });
        });

        // Listeners eliminar
        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', e => {
                cart.splice(parseInt(e.currentTarget.dataset.index), 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart-updated'));
                render();
            });
        });

        // Activar botón al elegir sucursal (solo cuando usa selector)
        const selectSuc = document.getElementById('sucursal-select');
        const btnComprar = document.getElementById('btn-comprar');
        if (selectSuc && btnComprar) {
            const check = () => { btnComprar.disabled = !selectSuc.value || !zolesOk; };
            check();
            selectSuc.addEventListener('change', check);
        }

        // Checkout
        btnComprar?.addEventListener('click', async () => {
            const errorBox = document.getElementById('checkout-error');
            errorBox.style.display = 'none';

            // Determinar la sucursal: fija del usuario o elegida en el selector
            const sucursalId = tienesSucursal
                ? user.sucursal_id
                : parseInt(document.getElementById('sucursal-select')?.value);

            if (!sucursalId) {
                errorBox.textContent   = 'Selecciona una sucursal antes de continuar.';
                errorBox.style.display = 'block';
                return;
            }

            try {
                btnComprar.disabled  = true;
                btnComprar.innerHTML = `<span class="ui-spinner"
                    style="width:20px;height:20px;border-width:3px;margin-right:0.5rem;"></span>
                    Procesando...`;

                const total = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
                await realizarCompra(user, cart, sucursalId);

                const updatedUser = await obtenerUsuarioPorId(user.id);
                guardarUsuarioLocal(updatedUser);

                localStorage.setItem('cart', '[]');
                window.dispatchEvent(new Event('cart-updated'));
                window.dispatchEvent(new Event('user-updated'));

                const sucNombre = sucursalFija?.nombre
                    ?? sucursales.find(s => s.id === sucursalId)?.nombre
                    ?? 'Tu sucursal';

                container.innerHTML = `
                    <div style="text-align:center; padding:6rem 2rem; background:var(--card-bg);
                        border-radius:var(--radius-lg); box-shadow:var(--shadow-sm);
                        max-width:600px; margin:4rem auto; border-top:5px solid var(--primary-color);">
                        <div style="width:80px; height:80px; background:#dcfce7; color:#16a34a;
                            border-radius:50%; display:flex; align-items:center; justify-content:center;
                            font-size:3rem; margin:0 auto 2rem;">✓</div>
                        <h2 style="font-size:2.5rem; margin-bottom:1rem;">¡Compra Exitosa!</h2>
                        <p style="color:var(--text-muted); margin-bottom:2rem;">
                            Tu pedido ha sido procesado correctamente.
                        </p>
                        <div style="background:var(--background-color); padding:1.5rem;
                            border-radius:var(--radius-md); margin-bottom:2rem; text-align:left;">
                            <p style="margin-bottom:0.5rem;">
                                Total pagado: <strong>$ ${total} Zoles</strong>
                            </p>
                            <p style="color:var(--text-muted); margin-bottom:0.5rem;">
                                Saldo restante: $ ${updatedUser.zoles} Zoles
                            </p>
                            <p style="color:var(--text-muted);">
                                <i class="fa-solid fa-location-dot" style="color:var(--primary-color);"></i>
                                Retiro en: <strong>${sucNombre}</strong>
                            </p>
                        </div>
                        <div style="display:flex; justify-content:center; gap:1rem;">
                            <a href="#/perfil"     class="btn btn-outline">Ver mis pedidos</a>
                            <a href="#/inventario" class="btn btn-primary">Seguir comprando</a>
                        </div>
                    </div>`;

            } catch (err) {
                errorBox.textContent   = err.message || 'Error procesando la compra.';
                errorBox.style.display = 'block';
                btnComprar.disabled    = false;
                btnComprar.innerHTML   = '<i class="fa-solid fa-money-check-dollar"></i> Confirmar y Pagar';
            }
        });
    };

    render();
};
