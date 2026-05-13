// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Carrito — Carrito + Checkout (Supabase)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from "../../core/supabaseClient.js";
import { obtenerUsuarioLocal, guardarUsuarioLocal, obtenerUsuarioPorId } from "../autenticacion/authService.js";

export const renderCarrito = (container) => {
    const user = obtenerUsuarioLocal();

    if (!user) {
        container.innerHTML = `
            <div style="text-align: center; padding: 6rem 2rem; background: var(--card-bg); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); max-width: 600px; margin: 4rem auto;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                <h2 style="font-size: 2rem; margin-bottom: 1rem;">Debes iniciar sesión</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Para poder ver tu carrito de compras y realizar pedidos necesitas una cuenta.</p>
                <a href="#/login" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem;">Ir al Login</a>
            </div>`;
        return;
    }

    const render = () => {
        let cart;
        try {
            cart = JSON.parse(localStorage.getItem("cart") || "[]");
        } catch {
            cart = [];
            localStorage.setItem("cart", "[]");
        }

        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 6rem 2rem; background: var(--card-bg); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); max-width: 600px; margin: 4rem auto;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">
                        <i class="fa-solid fa-cart-shopping"></i>
                    </div>
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
                                <div class="cart-item-img" style="display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-muted); text-align: center; ${item.imagen_url ? `background-image: url('${item.imagen_url}'); background-size: cover; background-position: center;` : ''}">
                                    ${!item.imagen_url ? `[Img ${item.nombre.split(' ')[0]}]` : ''}
                                </div>
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
                    `).join("")}
                </div>
                <div class="cart-summary">
                    <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--text-main);">Resumen de Compra</h3>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                        <span>Subtotal (${cart.reduce((a, i) => a + i.cantidad, 0)} artículos)</span>
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

                    <div id="checkout-error" style="display:none; background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-size:0.85rem;"></div>

                    <button id="btn-comprar" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;" ${!zolesSuficientes ? 'disabled' : ''}>
                        <i class="fa-solid fa-money-check-dollar"></i> Confirmar y Pagar
                    </button>
                </div>
            </div>
        `;

        // ── Eventos de cantidad ──
        document.querySelectorAll(".btn-qty").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const el = e.currentTarget;
                const index = parseInt(el.dataset.index);
                const action = el.dataset.action;

                if (action === "plus") {
                    cart[index].cantidad++;
                } else if (action === "minus" && cart[index].cantidad > 1) {
                    cart[index].cantidad--;
                }

                localStorage.setItem("cart", JSON.stringify(cart));
                window.dispatchEvent(new Event("cart-updated"));
                render();
            });
        });

        // ── Eventos de eliminar ──
        document.querySelectorAll(".btn-remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const el = e.target.closest(".btn-remove");
                const index = parseInt(el.dataset.index);
                cart.splice(index, 1);
                localStorage.setItem("cart", JSON.stringify(cart));
                window.dispatchEvent(new Event("cart-updated"));
                render();
            });
        });

        // ── Evento de checkout ──
        const btnComprar = document.getElementById("btn-comprar");
        if (btnComprar) {
            btnComprar.addEventListener("click", async () => {
                const errorBox = document.getElementById("checkout-error");
                errorBox.style.display = "none";

                try {
                    btnComprar.disabled = true;
                    btnComprar.innerHTML = '<span style="display:inline-block; width:20px; height:20px; border:3px solid white; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right: 0.5rem;"></span> Procesando...';

                    await realizarCompraSupabase(user, cart);

                    // Refrescar datos del usuario
                    const updatedUser = await obtenerUsuarioPorId(user.id);
                    guardarUsuarioLocal(updatedUser);

                    // Limpiar carrito
                    localStorage.setItem("cart", "[]");
                    window.dispatchEvent(new Event("cart-updated"));
                    window.dispatchEvent(new Event("user-updated"));

                    // Pantalla de éxito
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
                    console.error("Error en checkout:", error);
                    errorBox.textContent = error.message || "Error procesando la compra";
                    errorBox.style.display = "block";
                    btnComprar.disabled = false;
                    btnComprar.innerHTML = '<i class="fa-solid fa-money-check-dollar"></i> Confirmar y Pagar';
                }
            });
        }
    };

    render();
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Lógica de compra — TODO en Supabase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function realizarCompraSupabase(user, cartItems) {
    // 1. Calcular total
    let total = 0;
    for (const item of cartItems) {
        total += item.precio * item.cantidad;
    }

    // 2. Verificar zoles suficientes
    const { data: usuarioActual, error: userErr } = await supabase
        .from("usuarios")
        .select("zoles")
        .eq("id", user.id)
        .single();

    if (userErr) throw userErr;
    if (usuarioActual.zoles < total) throw new Error("Zoles insuficientes.");

    // 3. Verificar stock de cada producto
    for (const item of cartItems) {
        const { data: invList, error: invErr } = await supabase
            .from("inventario")
            .select("id, stock")
            .eq("producto_id", item.producto_id)
            .limit(1);

        if (invErr || !invList || invList.length === 0) {
            throw new Error(`No se encontró inventario para ${item.nombre}`);
        }
        const inventarioItem = invList[0];
        if (inventarioItem.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${inventarioItem.stock}`);
        }
    }

    // 4. Crear pedido
    const { data: nuevoPedido, error: pedidoErr } = await supabase
        .from("pedidos")
        .insert([{
            usuario_id: user.id,
            total: total,
            estado: "completado"
        }])
        .select("*")
        .single();

    if (pedidoErr) throw pedidoErr;

    // 5. Crear detalles del pedido (uno por uno para evitar problemas de RLS en bulk)
    for (const item of cartItems) {
        const { error: detErr } = await supabase
            .from("detalle_pedido")
            .insert([{
                pedido_id: nuevoPedido.id,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            }]);
        
        if (detErr) throw detErr;
    }

    // 6. Descontar stock y registrar movimientos de inventario
    for (const item of cartItems) {
        // Obtener stock actual
        const { data: invDataList } = await supabase
            .from("inventario")
            .select("id, stock")
            .eq("producto_id", item.producto_id)
            .limit(1);

        const invData = invDataList[0];

        // Descontar stock
        await supabase
            .from("inventario")
            .update({ stock: invData.stock - item.cantidad })
            .eq("id", invData.id);

        // Registrar movimiento de inventario
        await supabase
            .from("movimientos_inventario")
            .insert([{
                producto_id: item.producto_id,
                tipo: "salida",
                cantidad: item.cantidad,
                descripcion: `Venta - Pedido #${nuevoPedido.id}`
            }]);
    }

    // 7. Descontar zoles del usuario
    await supabase
        .from("usuarios")
        .update({ zoles: usuarioActual.zoles - total })
        .eq("id", user.id);

    // 8. Registrar movimiento de zoles
    await supabase
        .from("movimientos_zoles")
        .insert([{
            usuario_id: user.id,
            tipo: "compra",
            cantidad: -total,
            descripcion: `Compra - Pedido #${nuevoPedido.id}`
        }]);

    return nuevoPedido;
}
