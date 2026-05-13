// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AuthService — SOLO lógica de autenticación
// Usa Supabase Auth + tabla "usuarios"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from "../../core/supabaseClient.js";

/**
 * Registra un usuario nuevo en Supabase Auth y crea su
 * registro en la tabla "usuarios" con rol_id = 1 (cliente)
 * y 1000 zoles iniciales.
 *
 * Devuelve el objeto completo del usuario desde la tabla
 * "usuarios" (con id, auth_id, nombre, email, rol_id, zoles, created_at).
 */
export async function registrarUsuario(nombre, email, password) {
    // 1. Crear cuenta en Supabase Auth
    const { data: authData, error: authError } =
        await supabase.auth.signUp({ email, password });

    if (authError) throw authError;

    const authUser = authData.user;
    if (!authUser) throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");

    // 2. Insertar en tabla "usuarios"
    const { data: nuevoUsuario, error: dbError } = await supabase
        .from("usuarios")
        .insert([{
            auth_id: authUser.id,
            nombre,
            email,
            rol_id: 1,   // cliente por defecto
            zoles: 1000
        }])
        .select("*")
        .single();

    if (dbError) throw dbError;

    return nuevoUsuario;
}

/**
 * Inicia sesión con Supabase Auth y devuelve el usuario
 * completo desde la tabla "usuarios".
 */
export async function iniciarSesion(email, password) {
    // 1. Autenticar con Supabase Auth
    const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

    if (authError) throw authError;

    const authUser = authData.user;

    // 2. Obtener datos completos del usuario desde la tabla "usuarios"
    const { data: usuarioDB, error: dbError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

    if (dbError) throw dbError;

    return usuarioDB;
}

/**
 * Cierra sesión en Supabase Auth y limpia localStorage.
 */
export async function cerrarSesion() {
    await supabase.auth.signOut();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("cart");
}

/**
 * Recupera la sesión activa de Supabase Auth.
 * Si existe, trae los datos completos del usuario
 * desde la tabla "usuarios" y actualiza localStorage.
 *
 * Devuelve el usuario completo o null si no hay sesión.
 */
export async function recuperarSesion() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) return null;

    const { data: usuarioDB, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", session.user.id)
        .single();

    if (error || !usuarioDB) return null;

    // Actualizar localStorage con datos frescos
    localStorage.setItem("currentUser", JSON.stringify(usuarioDB));

    return usuarioDB;
}

/**
 * Obtiene los datos actualizados de un usuario por su ID
 * desde la tabla "usuarios".
 */
export async function obtenerUsuarioPorId(id) {
    const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Lee currentUser de localStorage de forma segura,
 * sin errores JSON.parse(undefined).
 */
export function obtenerUsuarioLocal() {
    try {
        const raw = localStorage.getItem("currentUser");
        if (!raw || raw === "undefined" || raw === "null") return null;
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem("currentUser");
        return null;
    }
}

/**
 * Guarda el usuario en localStorage de forma segura.
 */
export function guardarUsuarioLocal(usuario) {
    if (!usuario) {
        localStorage.removeItem("currentUser");
        return;
    }
    localStorage.setItem("currentUser", JSON.stringify(usuario));
}

/**
 * Obtiene el nombre del rol a partir de su ID.
 */
export function obtenerNombreRol(rolId) {
    const roles = { 1: "cliente", 2: "admin", 3: "proveedor" };
    return roles[rolId] || "cliente";
}

console.log("✅ authService conectado");
