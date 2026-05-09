import { fakeApi } from '../../core/fakeApi.js';

export const renderCarrito = (container) => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        container.innerHTML = `
            <div style="text-align: center; padding: 6rem 2rem; background: var(--card-bg); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); max-width: 600px; margin: 4rem auto;">
                <h2 style="font-size: 2rem; margin-bottom: 1rem;">Debes iniciar sesión</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Para poder ver tu carrito de compras y realizar pedidos necesitas una cuenta.</p>
                <a href="#/login" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem;">Ir al Login</a>
            </div>`;
        return;
    }

    const render = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 6rem 2rem; background: var(--card-bg); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); max-width: 600px; margin: 4rem auto;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">
                    <i class="fa-solid fa-cart-shopping"></i> </div>
                    <h2 style="font-size: 2rem; margin-bottom: 1rem;">Tu carrito está vacío</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">Aún no has agregado ningún producto. Revisa nuestro catálogo.</p>
                    <a href="#/inventario" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem;">Ver Catálogo</a>
                </div>`;
            return;
        }

        const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        const zolesSuficientes = user.zoles >= total;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Carrito de Compras</h1>
                    <p style="color: var(--text-muted);">Revisa tus productos antes de finalizar la compra.</p>
                </div>
            </div>
            <div class="cart-layout">
                <div class="cart-items">
                    ${cart.map((item, index) => `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <div class="cart-item-img" style="display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-muted); text-align: center;">[Img ${item.nombre.split(' ')[0]}]</div>
                                <div>
                                    <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.25rem;">${item.nombre}</div>
                                    <div style="color: var(--primary-color); font-weight: 600;">$ ${item.precio} Zoles c/u</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 2rem;">
                                <div style="display: flex; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; background: white;">
                                    <button class="btn-qty" data-index="${index}" data-action="minus" style="padding: 0.5rem 1rem; border: none; background: transparent; cursor: pointer; font-size: 1.2rem; transition: background 0.2s;">-</button>
                                    <span style="padding: 0.5rem 1rem; border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color); font-weight: 600; min-width: 40px; text-align: center;">${item.cantidad}</span>
                                    <button class="btn-qty" data-index="${index}" data-action="plus" style="padding: 0.5rem 1rem; border: none; background: transparent; cursor: pointer; font-size: 1.2rem; transition: background 0.2s;">+</button>
                                </div>
                                <div style="font-weight: 800; font-size: 1.2rem; min-width: 100px; text-align: right;">$ ${item.precio * item.cantidad}</div>
                                <button class="btn-remove" data-index="${index}" style="background: #fee2e2; border: none; color: #ef4444; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: all 0.2s;">🗑</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-summary">
                    <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--text-main);">Resumen de Compra</h3>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                        <span>Subtotal</span>
                        <span>$ ${total} Zoles</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; color: var(--text-muted);">
                        <span>Descuentos</span>
                        <span>$ 0 Zoles</span>
                    </div>

                    <div class="cart-total-row">
                        <span>Total a pagar</span>
                        <span style="color: var(--primary-color);">$ ${total} Zoles</span>
                    </div>

                    <div style="margin-bottom: 2rem; background: var(--background-color); padding: 1rem; border-radius: var(--radius-md);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-muted); font-size: 0.9rem;">Tu saldo actual:</span>
                            <strong style="font-size: 1.1rem; color: ${zolesSuficientes ? 'inherit' : '#ef4444'};">$ ${user.zoles} Zoles</strong>
                        </div>
                        ${!zolesSuficientes ? `
                            <div style="color: #ef4444; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                                <span><i class="fa-solid fa-triangle-exclamation"></i></span> Zoles insuficientes para realizar esta compra.
                            </div>
                        ` : `
                            <div style="color: var(--primary-color); font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                                <span><i class="fa-regular fa-circle-check"></i></span> Saldo suficiente
                            </div>
                        `}
                    </div>

                    <button id="btn-comprar" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;" ${!zolesSuficientes ? 'disabled' : ''}>
                        <i class="fa-solid fa-money-check-dollar"></i> Confirmar y Pagar
                    </button>
                </div>
            </div>
        `;

        document.querySelectorAll('.btn-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const action = e.target.dataset.action;
                
                if (action === 'plus') {
                    cart[index].cantidad++;
                } else if (action === 'minus' && cart[index].cantidad > 1) {
                    cart[index].cantidad--;
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart-updated'));
                render();
            });
        });

        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnElement = e.target.closest('.btn-remove');
                const index = btnElement.dataset.index;
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart-updated'));
                render();
            });
        });

        const btnComprar = document.getElementById('btn-comprar');
        if (btnComprar) {
            btnComprar.addEventListener('click', async () => {
                try {
                    btnComprar.disabled = true;
                    btnComprar.innerHTML = '<span style="display:inline-block; width:20px; height:20px; border:3px solid white; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right: 0.5rem;"></span> Procesando...';
                    
                    await fakeApi.realizarCompra(user.id, 1, cart);
                    
                    const updatedUser = await fakeApi.obtenerUsuario(user.id);
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    
                    localStorage.setItem('cart', '[]');
                    window.dispatchEvent(new Event('cart-updated'));
                    window.dispatchEvent(new Event('user-updated'));
                    
                    container.innerHTML = `
                        <div style="text-align: center; padding: 6rem 2rem; background: var(--card-bg); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); max-width: 600px; margin: 4rem auto; border-top: 5px solid var(--primary-color);">
                            <div style="width: 80px; height: 80px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto 2rem;">✓</div>
                            <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-main);">¡Compra Exitosa!</h2>
                            <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 1.1rem;">Tu pedido ha sido procesado correctamente. Gracias por confiar en Mecani-Koc.</p>
                            <div style="background: var(--background-color); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem;">
                                <p style="font-size: 1.2rem;">Total pagado: <strong>$ ${total} Zoles</strong></p>
                                <p style="color: var(--text-muted);">Saldo restante: $ ${updatedUser.zoles} Zoles</p>
                            </div>
                            <div style="display: flex; justify-content: center; gap: 1rem;">
                                <a href="#/perfil" class="btn btn-outline">Ver mis pedidos</a>
                                <a href="#/inventario" class="btn btn-primary">Seguir comprando</a>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    alert(error.message);
                    render();
                }
            });
        }
    };

    render();
};
