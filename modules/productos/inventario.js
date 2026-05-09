import { fakeApi } from '../../core/fakeApi.js';

export const renderInventario = async (container, initialQuery = '') => {
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">Cargando inventario...</p>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    const productos = await fakeApi.obtenerProductos();
    const categorias = await fakeApi.obtenerCategorias();
    
    let currentCategoria = 'Todos';
    let searchQuery = initialQuery ? decodeURIComponent(initialQuery.split('=')[1] || '') : '';

    const renderProducts = () => {
        const grid = document.getElementById('product-grid');
        let filtered = productos;
        if (currentCategoria !== 'Todos') {
            filtered = filtered.filter(p => p.categoria === currentCategoria);
        }
        if (searchQuery) {
            filtered = filtered.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); background: var(--card-bg); border-radius: var(--radius-lg);">No se encontraron productos que coincidan con tu búsqueda.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(p => `
            <div class="product-card">
                <div class="product-img">[Imagen ${p.nombre}]</div>
                <div class="product-info">
                    <div class="product-category">${p.categoria}</div>
                    <h3 class="product-title">${p.nombre}</h3>
                    <p class="product-desc">${p.descripcion.length > 80 ? p.descripcion.substring(0, 80) + '...' : p.descripcion}</p>
                    <div class="product-price-row">
                        <div class="product-price">$ ${p.precio} <span>Zoles</span></div>
                        <div class="product-stock">${p.stock_total} disp.</div>
                    </div>
                    <button class="btn btn-primary btn-add-cart" data-id="${p.id}" ${p.stock_total === 0 ? 'disabled' : ''}>
                        ${p.stock_total > 0 ? '<i class="fa-solid fa-plus"></i> Agregar al carrito' : 'Agotado'}
                    </button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                const producto = productos.find(p => p.id === id);
                addToCart(producto);
            });
        });
    };

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-end; ">
            
            <div class="search-bar2" style="background: white;">
                
                <input  type="text" id="local-search" placeholder="Buscar en inventario..." value="${searchQuery}">
            </div>
        </div>




        
        <div class="category-filters" id="category-filters">
            <button class="category-pill ${currentCategoria === 'Todos' ? 'active' : ''}" data-cat="Todos">Todos</button>
            ${categorias.map(c => `<button class="category-pill" data-cat="${c.nombre}">${c.nombre}</button>`).join('')}
        </div>

        <div class="product-grid" id="product-grid"></div>
    `;

    document.getElementById('local-search').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
    });

    document.getElementById('category-filters').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-pill')) {
            document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategoria = e.target.dataset.cat;
            renderProducts();
        }
    });

    renderProducts();
};

const addToCart = (producto) => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert('Debes iniciar sesión para agregar productos al carrito.');
        window.location.hash = '#/login';
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.producto_id === producto.id);
    
    if (existing) {
        if (existing.cantidad < producto.stock_total) {
            existing.cantidad += 1;
        } else {
            alert('Has alcanzado el límite de stock disponible para este producto.');
            return;
        }
    } else {
        cart.push({
            producto_id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            sucursal_id: 1 // Por simplicidad asignamos a la sucursal central
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
};
