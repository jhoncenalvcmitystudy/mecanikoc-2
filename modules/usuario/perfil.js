import { fakeApi } from '../../core/fakeApi.js';

export const renderPerfil = async (container) => {
    let user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.hash = '#/login';
        return;
    }
    
    // Refresh user data from API
    user = await fakeApi.obtenerUsuario(user.id);
    localStorage.setItem('currentUser', JSON.stringify(user));

    const db = JSON.parse(localStorage.getItem('mecani_koc_db'));
    const misPedidos = db.pedidos.filter(p => p.usuario_id === user.id).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto;">
            
            <div style="background: var(--card-bg); padding: 3rem;  box-shadow: var(--shadow-md); margin-bottom: 3rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -5%; top: -50%; width: 300px; height: 300px;  opacity: 0.3;"></div>
                
                <div style="display: flex; gap: 2rem; align-items: center; position: relative; z-index: 1;">
                    <div style="width: 100px; height: 100px; background: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">
                        ${user.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style="font-size: 2rem; margin-bottom: 0.25rem; color: var(--text-main);">${user.nombre}</h2>
                        <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 0.5rem;">${user.email}</p>
                        <span style="background: var(--background-color); border: 1px solid var(--border-color); padding: 0.2rem 0.8rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">${user.rol_id === 1 ? 'Cliente' : user.rol_id === 2 ? 'Administrador' : 'Proveedor'}</span>
                    </div>
                </div>
                
                <div style="text-align: right; position: relative; z-index: 1;">
                    <div style="background: white; padding: 1.5rem 2.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid #fde68a;">
                        <div style="font-size: 2.5rem; font-weight: 800; color: #d97706;">$ ${user.zoles}</div>
                        <div style="color: #b45309; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.1em; font-weight: 700;">Zoles Disponibles</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.5rem;">Historial de Pedidos</h3>
                <button id="btn-logout" class="btn btn-outline" style="color: #ef4444; border-color: #fecaca; background: #fef2f2;">Cerrar Sesión</button>
            </div>

            <div style="background: var(--card-bg);  box-shadow: var(--shadow-md); border: 1px solid var(--border-color); overflow: hidden;">
                ${misPedidos.length === 0 ? `
                    <div style="padding: 4rem; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📦</div>
                        <h4 style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 0.5rem;">Aún no tienes pedidos</h4>
                        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Cuando realices una compra, aparecerá aquí.</p>
                        <a href="#/inventario" class="btn btn-primary">Ir a comprar</a>
                    </div>
                ` : `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: #22C55E; border-bottom: 2px solid var(--border-color);">
                                    <th style="padding: 1.25rem 1.5rem; color: #ffffff; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">ID Pedido</th>
                                    <th style="padding: 1.25rem 1.5rem; color: #ffffff; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Fecha</th>
                                    <th style="padding: 1.25rem 1.5rem; color: #ffffff; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Estado</th>
                                    <th style="padding: 1.25rem 1.5rem; color: #ffffff; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Total Pagado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${misPedidos.map(p => `
                                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;">
                                        <td style="padding: 1.25rem 1.5rem; font-weight: 600; color: var(--text-main);">#${p.id.toString().padStart(5, '0')}</td>
                                        <td style="padding: 1.25rem 1.5rem; color: var(--text-muted);">${new Date(p.fecha).toLocaleDateString()} a las ${new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td style="padding: 1.25rem 1.5rem;">
                                            <span style="background: #dcfce7; color: #16a34a; padding: 0.3rem 0.8rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                                                <span style="width: 6px; height: 6px; border-radius: 50%; background: #16a34a;"></span>
                                                ${p.estado}
                                            </span>
                                        </td>
                                        <td style="padding: 1.25rem 1.5rem; font-weight: 800; font-size: 1.1rem; color: var(--primary-color); text-align: right;">$ ${p.total} Zoles</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('user-updated'));
        window.dispatchEvent(new Event('cart-updated'));
        window.location.hash = '#/home';
    });
};
