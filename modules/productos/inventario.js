// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Inventario — Catálogo de productos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerProductosConInventario, obtenerCategorias } from '../../services/productosService.js';
import { obtenerUsuarioLocal } from '../autenticacion/authService.js';
import { spinner, emptyState, errorState } from '../../ui/components.js';

export const renderInventario = async (container, initialQuery = '') => {
    container.innerHTML = spinner('Cargando inventario...');

    try {
        const [productos, categorias] = await Promise.all([
            obtenerProductosConInventario(),
            obtenerCategorias()
        ]);

        // ── Estado local de filtros ──
        let currentCategoria = 'Todos';
        let searchQuery = initialQuery
            ? decodeURIComponent(initialQuery.split('=')[1] || '')
            : '';

        // ── Renderiza el grid de productos según filtros activos ──
        const renderGrid = () => {
            const grid = document.getElementById('product-grid');
            if (!grid) return;

            let filtered = productos;

            if (currentCategoria !== 'Todos') {
                filtered = filtered.filter(p => p.categoria === currentCategoria);
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(p =>
                    p.nombre.toLowerCase().includes(q) ||
                    p.descripcion.toLowerCase().includes(q)
                );
            }

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1;">
                        ${emptyState({
                            icon:    '🔍',
                            title:   'Sin resultados',
                            message: 'No se encontraron productos que coincidan con tu búsqueda.'
                        })}
                    </div>`;
                return;
            }

            grid.innerHTML = filtered.map(p => `
                <div class="product-card">
                    <div class="product-img"
                        ${p.imagen_url
                            ? `style="background-image: url('${p.imagen_url}');
                               background-size: cover; background-position: center;"`
                            : ''}>
                        ${!p.imagen_url
                            ? `<span style="font-size: 0.8rem;">[Imagen ${p.nombre.split(' ')[0]}]</span>`
                            : ''}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${p.categoria}</div>
                        <h3 class="product-title">${p.nombre}</h3>
                        <p class="product-desc">
                            ${p.descripcion.length > 80
                                ? p.descripcion.substring(0, 80) + '...'
                                : p.descripcion}
                        </p>
                        <div class="product-price-row">
                            <div class="product-price">$ ${p.precio} <span>Zoles</span></div>
                            <div class="product-stock ${p.stock_total === 0 ? 'out-of-stock' : ''}">
                                ${p.stock_total > 0 ? p.stock_total + ' disp.' : 'Agotado'}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-add-cart"
                            data-id="${p.id}" ${p.stock_total === 0 ? 'disabled' : ''}>
                            ${p.stock_total > 0
                                ? '<i class="fa-solid fa-plus"></i> Agregar al carrito'
                                : '<i class="fa-solid fa-ban"></i> Agotado'}
                        </button>
                    </div>
                </div>
            `).join('');

            // Listeners para agregar al carrito
            grid.querySelectorAll('.btn-add-cart').forEach(btn => {
                btn.addEventListener('click', e => {
                    const id      = parseInt(e.currentTarget.dataset.id);
                    const producto = productos.find(p => p.id === id);
                    if (producto) addToCart(producto);
                });
            });
        };

        // ── Layout principal ──
        container.innerHTML = `
            <div class="category-filters" id="category-filters">
                <button class="category-pill active" data-cat="Todos">Todos</button>
                ${categorias.map(c =>
                    `<button class="category-pill" data-cat="${c.nombre}">${c.nombre}</button>`
                ).join('')}
            </div>
            <div class="product-grid" id="product-grid"></div>
        `;

        // Listener de filtros por categoría
        document.getElementById('category-filters').addEventListener('click', e => {
            if (!e.target.classList.contains('category-pill')) return;
            document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategoria = e.target.dataset.cat;
            renderGrid();
        });

        // Sincronizar con búsqueda global del header
        const globalSearch = document.getElementById('global-search');
        if (globalSearch && searchQuery) {
            globalSearch.value = searchQuery;
        }

        renderGrid();

    } catch (error) {
        console.error('Error cargando inventario:', error);
        container.innerHTML = errorState(error.message);
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Agregar producto al carrito (localStorage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const addToCart = (producto) => {
    const user = obtenerUsuarioLocal();
    if (!user) {
        alert('Debes iniciar sesión para agregar productos al carrito.');
        window.location.hash = '#/login';
        return;
    }

    let cart;
    try {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
        cart = [];
    }

    const existing = cart.find(i => i.producto_id === producto.id);

    if (existing) {
        if (existing.cantidad < producto.stock_total) {
            existing.cantidad++;
        } else {
            alert('Has alcanzado el límite de stock disponible.');
            return;
        }
    } else {
        cart.push({
            producto_id: producto.id,
            nombre:      producto.nombre,
            precio:      producto.precio,
            imagen_url:  producto.imagen_url || null,
            cantidad:    1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));

    // Micro-feedback visual en el badge del carrito
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.style.transform = 'scale(1.3)';
        setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }
};
