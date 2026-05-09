const DB_KEY = 'mecani_koc_db';

const initDB = () => {
    if (!localStorage.getItem(DB_KEY)) {
        const initialData = {
            roles: [
                { id: 1, nombre: 'cliente' },
                { id: 2, nombre: 'admin' },
                { id: 3, nombre: 'proveedor' }
            ],
            usuarios: [
                { id: 1, nombre: 'Admin User', email: 'admin@mecanikoc.com', password: '123', rol_id: 2, zoles: 10000, ultimo_reclamo: null },
                { id: 2, nombre: 'Cliente Prueba', email: 'cliente@mecanikoc.com', password: '123', rol_id: 1, zoles: 5000, ultimo_reclamo: null }
            ],
            movimientos_zoles: [],
            proveedores: [
                { id: 1, nombre: 'Herramientas Pro', contacto: 'Juan', telefono: '123456789' }
            ],
            categorias: [
                { id: 1, nombre: 'Herramientas' },
                { id: 2, nombre: 'Repuestos' },
                { id: 3, nombre: 'Accesorios' },
                { id: 4, nombre: 'Lubricantes' }
            ],
            sucursales: [
                { id: 1, nombre: 'Sede Central', ubicacion: 'Lima' },
                { id: 2, nombre: 'Sede Norte', ubicacion: 'Trujillo' }
            ],
            productos: [
                { id: 1, nombre: 'Llave inglesa reforzada', descripcion: 'Ideal para todo uso de preferencia, mejores sus condiciones y trabajo, use esta llave inglesa anaranjada y azul para su trabajo.', precio: 20, categoria_id: 1, proveedor_id: 1 },
                { id: 2, nombre: 'Motor Trifásico', descripcion: 'Motor industrial de alta potencia. Perfecto para maquinarias pesadas.', precio: 500, categoria_id: 2, proveedor_id: 1 },
                { id: 3, nombre: 'Aceite de Motor Top Tec', descripcion: 'Aceite sintético 5W-30 de alto rendimiento para motores exigentes.', precio: 35, categoria_id: 4, proveedor_id: 1 },
                { id: 4, nombre: 'Llantas Deportivas', descripcion: 'Llantas de alto rendimiento y agarre superior.', precio: 150, categoria_id: 3, proveedor_id: 1 },
                { id: 5, nombre: 'Tuerca Móvil', descripcion: 'Set de tuercas ajustables de acero inoxidable.', precio: 15, categoria_id: 2, proveedor_id: 1 },
                { id: 6, nombre: 'Batería Premium', descripcion: 'Batería de larga duración para todo tipo de vehículos.', precio: 210, categoria_id: 2, proveedor_id: 1 },
                { id: 7, nombre: 'Alicate Profesional', descripcion: 'Alicate con mango ergonómico amarillo.', precio: 25, categoria_id: 1, proveedor_id: 1 },
                { id: 8, nombre: 'Volante Deportivo', descripcion: 'Volante con acabados en cuero y diseño ergonómico.', precio: 120, categoria_id: 3, proveedor_id: 1 }
            ],
            inventario: [
                { id: 1, producto_id: 1, sucursal_id: 1, stock: 100 },
                { id: 2, producto_id: 2, sucursal_id: 1, stock: 10 },
                { id: 3, producto_id: 3, sucursal_id: 1, stock: 50 },
                { id: 4, producto_id: 4, sucursal_id: 1, stock: 20 },
                { id: 5, producto_id: 5, sucursal_id: 1, stock: 200 },
                { id: 6, producto_id: 6, sucursal_id: 1, stock: 15 },
                { id: 7, producto_id: 7, sucursal_id: 1, stock: 80 },
                { id: 8, producto_id: 8, sucursal_id: 1, stock: 5 }
            ],
            pedidos: [],
            detalle_pedido: [],
            movimientos_inventario: []
        };
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
    }
};

initDB();

const getDB = () => JSON.parse(localStorage.getItem(DB_KEY));
const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

// Simulación de retraso de red
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fakeApi = {
    registrarUsuario: async (nombre, email, password) => {
        await delay(500);
        const db = getDB();
        if (db.usuarios.find(u => u.email === email)) throw new Error('El correo ya está registrado.');
        const newUser = {
            id: db.usuarios.length + 1,
            nombre,
            email,
            password,
            rol_id: 1, // cliente
            zoles: 1000,
            ultimo_reclamo: new Date().toISOString()
        };
        db.usuarios.push(newUser);
        saveDB(db);
        return newUser;
    },
    
    loginUsuario: async (email, password) => {
        await delay(500);
        const db = getDB();
        const user = db.usuarios.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Credenciales incorrectas.');
        return user;
    },
    
    obtenerUsuario: async (id) => {
        const db = getDB();
        return db.usuarios.find(u => u.id === id);
    },
    
    obtenerCategorias: async () => {
        const db = getDB();
        return db.categorias;
    },
    
    obtenerProductos: async () => {
        await delay(300);
        const db = getDB();
        return db.productos.map(p => {
            const categoria = db.categorias.find(c => c.id === p.categoria_id);
            // Sumamos el stock de todas las sucursales para el front
            const stockTotal = db.inventario.filter(i => i.producto_id === p.id).reduce((acc, curr) => acc + curr.stock, 0);
            return { ...p, categoria: categoria?.nombre, stock_total: stockTotal };
        });
    },
    
    realizarCompra: async (usuarioId, sucursalId, items) => {
        await delay(800); // Simulando procesamiento
        const db = getDB();
        const usuario = db.usuarios.find(u => u.id === usuarioId);
        
        let total = 0;
        for (let item of items) {
            const producto = db.productos.find(p => p.id === item.producto_id);
            total += producto.precio * item.cantidad;
        }

        if (usuario.zoles < total) throw new Error('Zoles insuficientes.');

        // Validar stock antes de procesar
        for (let item of items) {
            const inventarioItem = db.inventario.find(i => i.producto_id === item.producto_id && i.sucursal_id === sucursalId);
            if (!inventarioItem || inventarioItem.stock < item.cantidad) {
                const producto = db.productos.find(p => p.id === item.producto_id);
                throw new Error(`Stock insuficiente para ${producto.nombre} en la sucursal seleccionada.`);
            }
        }

        // Crear registro del pedido
        const nuevoPedido = {
            id: db.pedidos.length + 1,
            usuario_id: usuarioId,
            sucursal_id: sucursalId,
            fecha: new Date().toISOString(),
            estado: 'completado',
            total
        };
        db.pedidos.push(nuevoPedido);

        // Procesar detalles y descontar stock
        for (let item of items) {
            const producto = db.productos.find(p => p.id === item.producto_id);
            
            db.detalle_pedido.push({
                id: db.detalle_pedido.length + 1,
                pedido_id: nuevoPedido.id,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: producto.precio
            });

            const inventarioItem = db.inventario.find(i => i.producto_id === item.producto_id && i.sucursal_id === sucursalId);
            inventarioItem.stock -= item.cantidad;

            db.movimientos_inventario.push({
                id: db.movimientos_inventario.length + 1,
                producto_id: item.producto_id,
                sucursal_id: sucursalId,
                tipo: 'salida',
                cantidad: item.cantidad,
                fecha: new Date().toISOString()
            });
        }

        // Descontar saldo y registrar movimiento
        usuario.zoles -= total;
        db.movimientos_zoles.push({
            id: db.movimientos_zoles.length + 1,
            usuario_id: usuarioId,
            tipo: 'compra',
            monto: -total,
            fecha: new Date().toISOString()
        });

        saveDB(db);
        return nuevoPedido;
    }
};
