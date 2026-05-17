// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Servicio de Carrito — Lógica de compra en Supabase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from '../core/supabaseClient.js';

/**
 * Procesa la compra completa para una sucursal específica:
 * 1. Verifica saldo de Zoles (desde BD, no desde localStorage)
 * 2. Verifica stock por producto EN la sucursal seleccionada
 * 3. Crea el pedido con sucursal_id
 * 4. Crea los detalles del pedido
 * 5. Descuenta stock de la sucursal y registra movimientos de inventario
 * 6. Descuenta Zoles del usuario y registra movimiento de Zoles
 *
 * @param {object} user       - Usuario local con { id, zoles }
 * @param {Array}  cartItems  - Items: [{ producto_id, nombre, precio, cantidad }]
 * @param {number} sucursalId - ID de la sucursal seleccionada por el usuario
 * @returns {object} El pedido creado
 */
export async function realizarCompra(user, cartItems, sucursalId) {
    if (!sucursalId) throw new Error('Debes seleccionar una sucursal.');

    // 1. Calcular total
    const total = cartItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    // 2. Verificar Zoles suficientes (dato fresco desde BD)
    const { data: usuarioActual, error: userErr } = await supabase
        .from('usuarios')
        .select('zoles')
        .eq('id', user.id)
        .single();

    if (userErr) throw userErr;
    if (usuarioActual.zoles < total) throw new Error('Zoles insuficientes.');

    // 3. Verificar stock de cada producto EN la sucursal seleccionada
    for (const item of cartItems) {
        const { data: invList, error: invErr } = await supabase
            .from('inventario')
            .select('id, stock')
            .eq('producto_id', item.producto_id)
            .eq('sucursal_id', sucursalId)
            .limit(1);

        if (invErr || !invList || invList.length === 0) {
            throw new Error(`"${item.nombre}" no tiene inventario en la sucursal seleccionada.`);
        }
        if (invList[0].stock < item.cantidad) {
            throw new Error(
                `Stock insuficiente para "${item.nombre}" en esta sucursal. Disponible: ${invList[0].stock}`
            );
        }
    }

    // 4. Crear pedido con sucursal_id
    const { data: nuevoPedido, error: pedidoErr } = await supabase
        .from('pedidos')
        .insert([{
            usuario_id:  user.id,
            sucursal_id: sucursalId,
            total,
            estado:      'completado'
        }])
        .select('*')
        .single();

    if (pedidoErr) throw pedidoErr;

    // 5. Insertar detalles del pedido
    for (const item of cartItems) {
        const { error: detErr } = await supabase
            .from('detalle_pedido')
            .insert([{
                pedido_id:       nuevoPedido.id,
                producto_id:     item.producto_id,
                cantidad:        item.cantidad,
                precio_unitario: item.precio
            }]);
        if (detErr) throw detErr;
    }

    // 6. Descontar stock de la sucursal y registrar movimientos de inventario
    for (const item of cartItems) {
        // Obtener el registro de inventario específico (producto × sucursal)
        const { data: invDataList } = await supabase
            .from('inventario')
            .select('id, stock')
            .eq('producto_id', item.producto_id)
            .eq('sucursal_id', sucursalId)
            .limit(1);

        const inv = invDataList[0];

        await supabase
            .from('inventario')
            .update({ stock: inv.stock - item.cantidad })
            .eq('id', inv.id);

        // Registrar movimiento — sin descripcion (no existe en la BD)
        await supabase
            .from('movimientos_inventario')
            .insert([{
                producto_id:  item.producto_id,
                sucursal_id:  sucursalId,
                tipo:         'salida',
                cantidad:     item.cantidad
            }]);
    }

    // 7. Descontar Zoles del usuario
    await supabase
        .from('usuarios')
        .update({ zoles: usuarioActual.zoles - total })
        .eq('id', user.id);

    // 8. Registrar movimiento de Zoles — columna es "monto", no "cantidad"
    await supabase
        .from('movimientos_zoles')
        .insert([{
            usuario_id: user.id,
            tipo:       'compra',
            monto:      -total      // campo correcto según el esquema
        }]);

    return nuevoPedido;
}
