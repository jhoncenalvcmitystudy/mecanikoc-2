export const renderHome = (container) => {
    container.innerHTML = `
        <div class="hero">
            <div class="hero-content">
                <h1>Mecani-<span>koc</span></h1>
                <p>La mejor plataforma nacional para comprar sus herramientas mecánicas, sé parte del cambio, sé un mecánico preparado.</p>
                
            </div>
            <div class="hero-image-placeholder">
                
            </div>
        </div>
        <div>
            <h2 style="color: var(--text-main); margin-bottom: 2rem; font-size: 2rem; text-align: center;">Sobre nosotros</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
                <div style="padding: 40px; min-height: 200px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">🔧 Calidad Garantizada

En cada producto que ofrecemos, la excelencia es nuestra prioridad. Trabajamos con proveedores confiables y materiales de primera para asegurar que cada artículo cumpla con los más altos estándares de calidad. Tu satisfacción está respaldada por nuestra garantía.</div>
                <div style="padding: 40px; min-height: 200px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">🚚 Envío Rápido
Sabemos que el tiempo es esencial en el mundo de la mecánica. Por eso, contamos con un sistema de logística eficiente que asegura entregas rápidas a nivel nacional. Compra hoy y recibe tus artículos en el menor tiempo posible.</div>
                <div style="padding: 40px; min-height: 200px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">📞 Soporte 24/7
Nunca estarás solo. Nuestro equipo de atención al cliente está disponible las 24 horas, los 7 días de la semana, para resolver tus dudas y ayudarte en cada paso de tu compra. La confianza y el acompañamiento son parte de nuestro servicio.</div>
            </div>
        </div>
    `;
};
