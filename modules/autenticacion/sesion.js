// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Módulo Sesión — Persistencia de sesión con Supabase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { recuperarSesion, obtenerUsuarioLocal, guardarUsuarioLocal } from "./authService.js";

/**
 * Inicializa la sesión al cargar la app.
 * Intenta recuperar la sesión de Supabase Auth y
 * sincronizar con localStorage.
 */
export async function inicializarSesion() {
    // Primero verificar si hay datos locales
    const localUser = obtenerUsuarioLocal();

    // Intentar recuperar sesión desde Supabase
    try {
        const supaUser = await recuperarSesion();

        if (supaUser) {
            // Sesión válida: actualizar con datos frescos
            guardarUsuarioLocal(supaUser);
            return supaUser;
        } else {
            // No hay sesión en Supabase → limpiar datos locales stale
            if (localUser) {
                guardarUsuarioLocal(null);
            }
            return null;
        }
    } catch (error) {
        console.warn("Error al recuperar sesión:", error);
        // Si hay error de red pero hay datos locales, usarlos temporalmente
        return localUser;
    }
}

console.log("✅ Módulo sesión listo");
