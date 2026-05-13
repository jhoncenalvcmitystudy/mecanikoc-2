// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Inventario — Catálogo de productos (Supabase)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from "../../core/supabaseClient.js";
import { obtenerUsuarioLocal } from "../autenticacion/authService.js";

export const renderInventario = async (container, initialQuery = "") => {
    // Spinner de carga
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">Cargando inventario...</p>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    try {
        // ── Traer datos de Supabase ──
        const { data: productosRaw, error: prodError } = await supabase
            .from("productos")
            .select(`
                *,
                categorias ( nombre ),
                proveedores ( nombre ),
                inventario ( stock )
            `);

        if (prodError) throw prodError;

        const { data: categorias, error: catError } = await supabase
            .from("categorias")
            .select("*");

        if (catError) throw catError;

        // ── Normalizar productos ──
        const productos = productosRaw.map(p => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion || "",
            precio: p.precio,
            imagen_url: p.imagen_url,
            categoria_id: p.categoria_id,
            proveedor_id: p.proveedor_id,
            categoria: p.categorias?.nombre || "Sin categoría",
            proveedor: p.proveedores?.nombre || "—",
            stock_total: p.inventario
                ? p.inventario.reduce((acc, inv) => acc + (inv.stock || 0), 0)
                : 0
        }));

        // ── Estado local de filtros ──
        let currentCategoria = "Todos";
        let searchQuery = initialQuery
            ? decodeURIComponent(initialQuery.split("=")[1] || "")
            : "";

        // ── Función interna para renderizar grid ──
        const renderProducts = () => {
            const grid = document.getElementById("product-grid");
            if (!grid) return;

            let filtered = productos;

            if (currentCategoria !== "Todos") {
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
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); background: var(--card-bg); border-radius: var(--radius-lg);">
                        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🔍</div>
                        <p>No se encontraron productos que coincidan con tu búsqueda.</p>
                    </div>`;
                return;
            }

            grid.innerHTML = filtered.map(p => `
                <div class="product-card">
                    <div class="product-img" ${p.imagen_url ? `style="background-image: url('${p.imagen_url}'); background-size: cover; background-position: center;"` : ''}>
                        ${!p.imagen_url ? `<span style="font-size: 0.8rem;">[Imagen ${p.nombre.split(' ')[0]}]</span>` : ''}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${p.categoria}</div>
                        <h3 class="product-title">${p.nombre}</h3>
                        <p class="product-desc">${p.descripcion.length > 80 ? p.descripcion.substring(0, 80) + '...' : p.descripcion}</p>
                        <div class="product-price-row">
                            <div class="product-price">$ ${p.precio} <span>Zoles</span></div>
                            <div class="product-stock ${p.stock_total === 0 ? 'out-of-stock' : ''}">${p.stock_total > 0 ? p.stock_total + ' disp.' : 'Agotado'}</div>
                        </div>
                        <button class="btn btn-primary btn-add-cart" data-id="${p.id}" ${p.stock_total === 0 ? 'disabled' : ''}>
                            ${p.stock_total > 0 ? '<i class="fa-solid fa-plus"></i> Agregar al carrito' : '<i class="fa-solid fa-ban"></i> Agotado'}
                        </button>
                    </div>
                </div>
            `).join("");

            // ── Listeners para agregar al carrito ──
            document.querySelectorAll(".btn-add-cart").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    const producto = productos.find(p => p.id === id);
                    if (producto) addToCart(producto);
                });
            });
        };

        // ── Layout principal ──
        container.innerHTML = `
            

            <div class="category-filters" id="category-filters">
                <button class="category-pill ${currentCategoria === 'Todos' ? 'active' : ''}" data-cat="Todos">Todos</button>
                ${categorias.map(c => `<button class="category-pill" data-cat="${c.nombre}">${c.nombre}</button>`).join("")}
            </div>

            <div class="product-grid" id="product-grid"></div>
        `;

        // ── Eventos ──
        document.getElementById("category-filters").addEventListener("click", (e) => {
            if (e.target.classList.contains("category-pill")) {
                document.querySelectorAll(".category-pill").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                currentCategoria = e.target.dataset.cat;
                renderProducts();
            }
        });

        // Escuchar cambios del search global (header)
        const globalSearch = document.getElementById("global-search");
        if (globalSearch && searchQuery) {
            globalSearch.value = searchQuery;
        }

        renderProducts();

    } catch (error) {
        console.error("Error cargando inventario:", error);
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #ef4444;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2>Error al cargar productos</h2>
                <p style="margin-top: 0.5rem; color: var(--text-muted);">${error.message}</p>
                <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="location.reload()">Reintentar</button>
            </div>`;
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Agregar producto al carrito (localStorage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const addToCart = (producto) => {
    const user = obtenerUsuarioLocal();
    if (!user) {
        alert("Debes iniciar sesión para agregar productos al carrito.");
        window.location.hash = "#/login";
        return;
    }

    let cart;
    try {
        cart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
        cart = [];
    }

    const existing = cart.find(i => i.producto_id === producto.id);

    if (existing) {
        if (existing.cantidad < producto.stock_total) {
            existing.cantidad += 1;
        } else {
            alert("Has alcanzado el límite de stock disponible.");
            return;
        }
    } else {
        cart.push({
            producto_id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen_url: producto.imagen_url || null,
            cantidad: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));

    // Micro-feedback visual
    const badge = document.querySelector(".cart-badge");
    if (badge) {
        badge.style.transform = "scale(1.3)";
        setTimeout(() => { badge.style.transform = "scale(1)"; }, 200);
    }
};
