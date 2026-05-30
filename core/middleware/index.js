// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Middleware Layer — Punto de entrada público
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Exporta `apiCall`, la función que los servicios usan
// para pasar por el pipeline completo de middlewares
// antes de llegar a Supabase.
//
// Arquitectura del pipeline:
//
//   corsGuard → logger → rateLimiter → auth → supabaseAdapter
//
// Equivalente a la cadena de filtros de Spring Boot:
//
//   CorsFilter → LoggingFilter → RateLimiterFilter
//             → JwtAuthenticationFilter → Repository
//
// Uso desde un servicio:
//   import { apiCall } from '../core/middleware/index.js';
//
//   // Endpoint público (sin auth):
//   const sucursales = await apiCall('sucursales:select');
//
//   // Endpoint protegido (requiere sesión):
//   const pedido = await apiCall('pedidos:insert', {
//       data: { usuario_id, sucursal_id, total, estado: 'completado' },
//       single: true
//   });
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { ejecutarPipeline as apiCall } from './gateway.js';

// Re-exportar utilidades opcionales para uso avanzado
export { log }             from './logger.js';
export { verificarLimite } from './rateLimiter.js';

console.log('✅ API Gateway (Middleware Layer) inicializado');
