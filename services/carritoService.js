// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Servicio de Carrito — Lógica de compra en Supabase
// Operaciones protegidas a través del API Gateway
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from '../core/supabaseClient.js';
import { apiCall }  from '../core/middleware/index.js';

/**
 * Procesa la compra completa para una sucursal específica:
 * 1. Verifica saldo de Soles (desde BD, no desde localStorage)
 * 2. Verifica stock por producto EN la sucursal seleccionada
 * 3. Valida el precio real de base de datos (con ofertas locales)
 * 4. Crea el pedido con sucursal_id
 * 5. Crea los detalles del pedido
 * 6. Descuenta stock y registra movimientos de inventario
 * 7. Descuenta Soles del usuario y registra movimiento de Soles
 *
 * @param {object} user       - Usuario local con { id, soles }
 * @param {Array}  cartItems  - Items: [{ producto_id, nombre, precio, cantidad }]
 * @param {number} sucursalId - ID de la sucursal seleccionada por el usuario
 * @returns {object} El pedido creado
 */
export async function realizarCompra(user, cartItems, sucursalId) {
    if (!sucursalId) throw new Error('Debes seleccionar una sucursal.');

    // 1. Validar stock y precios desde base de datos (seguridad backend)
    let total = 0;
    const itemsVerificados = [];

    for (const item of cartItems) {
        // Obtenemos información fresca de stock y de precio/oferta local
        const { data: invData, error: invErr } = await supabase
            .from('inventario')
            .select('id, stock, en_oferta, precio_oferta, productos(precio)')
            .eq('producto_id', item.producto_id)
            .eq('sucursal_id', sucursalId)
            .maybeSingle();

        if (invErr || !invData) {
            throw new Error(`"${item.nombre}" no tiene inventario en la sucursal seleccionada.`);
        }
        if (invData.stock < item.cantidad) {
            throw new Error(
                `Stock insuficiente para "${item.nombre}". Disponible: ${invData.stock}`
            );
        }

        // Si el producto está en oferta en esta sucursal, usamos el precio_oferta
        const precioReal = (invData.en_oferta && invData.precio_oferta !== null)
            ? parseFloat(invData.precio_oferta)
            : parseFloat(invData.productos.precio);

        total += precioReal * item.cantidad;
        itemsVerificados.push({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio: precioReal,
            invId: invData.id,
            stockActual: invData.stock
        });
    }

    // 2. Verificar Soles suficientes (dato fresco desde BD)
    const { data: usuarioActual, error: userErr } = await supabase
        .from('usuarios')
        .select('soles')
        .eq('id', user.id)
        .single();

    if (userErr) throw userErr;
    if (usuarioActual.soles < total) throw new Error('Soles insuficientes.');

    // 3. Crear pedido con sucursal_id ← API Gateway
    const nuevoPedido = await apiCall('pedidos:insert', {
        data: {
            usuario_id:  user.id,
            sucursal_id: sucursalId,
            total,
            estado:      'completado'
        },
        single: true
    });

    // 4. Insertar detalles del pedido ← API Gateway
    for (const item of itemsVerificados) {
        await apiCall('detalle_pedido:insert', {
            data: {
                pedido_id:       nuevoPedido.id,
                producto_id:     item.producto_id,
                cantidad:        item.cantidad,
                precio_unitario: item.precio
            }
        });
    }

    // 5. Descontar stock y registrar movimientos de inventario
    for (const item of itemsVerificados) {
        await supabase
            .from('inventario')
            .update({ stock: item.stockActual - item.cantidad })
            .eq('id', item.invId);

        await supabase
            .from('movimientos_inventario')
            .insert([{
                producto_id:  item.producto_id,
                sucursal_id:  sucursalId,
                tipo:         'salida',
                cantidad:     item.cantidad
            }]);
    }

    // 6. Descontar Soles del usuario
    await apiCall('usuarios:update', {
        data:   { soles: usuarioActual.soles - total },
        filter: { id: user.id }
    });

    // 7. Registrar movimiento de Soles
    await apiCall('movimientos_soles:insert', {
        data: {
            usuario_id: user.id,
            tipo:       'compra',
            monto:      -total
        }
    });

    return nuevoPedido;
}
