// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Inventario — Catálogo de productos con ofertas locales
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { obtenerProductosConInventario, obtenerCategorias } from '../../services/productosService.js';
import { obtenerUsuarioLocal } from '../autenticacion/authService.js';
import { spinner, emptyState, errorState } from '../../ui/components.js';

export const renderInventario = async (container, initialQuery = '') => {
    container.innerHTML = spinner('Cargando catálogo...');

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

            grid.innerHTML = filtered.map(p => {
                const user = obtenerUsuarioLocal();
                const userSucursalId = user ? user.sucursal_id : null;
                
                let stockText = '';
                let badgeClass = '';
                let badgeStyle = '';
                let sucursalInfoHTML = '';
                let canAdd = false;
                let priceHTML = `S/. ${p.precio}`;

                if (user) {
                    if (userSucursalId) {
                        const invItem = p.inventario ? p.inventario.find(inv => inv.sucursal_id === userSucursalId) : null;
                        const stockSucursal = invItem ? invItem.stock : 0;
                        const sucursalNombre = invItem ? invItem.sucursal_nombre : 'tu sede';
                        
                        canAdd = stockSucursal > 0;
                        stockText = canAdd ? `${stockSucursal} disp. (${sucursalNombre})` : `Agotado en (${sucursalNombre})`;
                        badgeClass = canAdd ? 'product-stock' : 'product-stock out-of-stock';
                        badgeStyle = canAdd ? 'color: #15803d; background: #f0fdf4; font-weight: 600;' : '';
                        
                        // Si está en oferta localmente
                        if (invItem && invItem.en_oferta && invItem.precio_oferta !== null) {
                            priceHTML = `
                                <span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.9rem; font-weight: normal; margin-right: 0.4rem;">S/. ${p.precio}</span>
                                <span style="color: #ef4444; font-weight: 800;">S/. ${invItem.precio_oferta}</span>
                                <span style="background: #fee2e2; color: #ef4444; font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.3rem; border-radius: 4px; margin-left: 0.3rem; vertical-align: middle;">OFERTA</span>
                            `;
                        }

                        if (p.stock_total > stockSucursal) {
                            sucursalInfoHTML = `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; text-align: right; width: 100%;">
                                Stock global: ${p.stock_total}
                            </div>`;
                        }
                    } else {
                        canAdd = p.stock_total > 0;
                        stockText = canAdd ? `${p.stock_total} disp. (Sin sede)` : 'Agotado';
                        badgeClass = canAdd ? 'product-stock' : 'product-stock out-of-stock';
                        badgeStyle = canAdd ? 'color: #ca8a04; background: #fef9c3; font-weight: 600;' : '';
                        sucursalInfoHTML = `<div style="font-size: 0.75rem; color: #d97706; margin-top: 0.25rem; text-align: right; width: 100%;">
                            Elige una sucursal en tu perfil para comprar
                        </div>`;
                    }
                } else {
                    canAdd = p.stock_total > 0;
                    stockText = canAdd ? `${p.stock_total} disp.` : 'Agotado';
                    badgeClass = canAdd ? 'product-stock' : 'product-stock out-of-stock';
                }

                return `
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
                            <div class="product-price-row" style="flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                                <div class="product-price" style="font-size:1.3rem;">${priceHTML}</div>
                                <div class="${badgeClass}" style="${badgeStyle}">
                                    ${stockText}
                                </div>
                                ${sucursalInfoHTML}
                            </div>
                            <button class="btn btn-primary btn-add-cart"
                                data-id="${p.id}" ${!canAdd ? 'disabled' : ''}>
                                ${canAdd
                                    ? '<i class="fa-solid fa-plus"></i> Agregar al carrito'
                                    : '<i class="fa-solid fa-ban"></i> No disponible'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

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

    const userSucursalId = user ? user.sucursal_id : null;
    let limitStock = producto.stock_total;
    let precioVenta = producto.precio;

    if (userSucursalId) {
        const invItem = producto.inventario ? producto.inventario.find(inv => inv.sucursal_id === userSucursalId) : null;
        limitStock = invItem ? invItem.stock : 0;
        if (invItem && invItem.en_oferta && invItem.precio_oferta !== null) {
            precioVenta = invItem.precio_oferta;
        }
    }

    const existing = cart.find(i => i.producto_id === producto.id);

    if (existing) {
        if (existing.cantidad < limitStock) {
            existing.cantidad++;
            existing.precio = precioVenta; // Actualizar por si cambió
        } else {
            alert('Has alcanzado el límite de stock disponible en tu sucursal.');
            return;
        }
    } else {
        if (limitStock <= 0) {
            alert('Este producto no tiene stock disponible en tu sucursal.');
            return;
        }
        cart.push({
            producto_id: producto.id,
            nombre:      producto.nombre,
            precio:      precioVenta,
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
