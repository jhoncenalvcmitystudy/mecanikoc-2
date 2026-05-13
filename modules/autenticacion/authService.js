console.log("authService conectado");
import { supabase }
from "../../core/supabaseClient.js";

export async function registrarUsuario(
  nombre,
  email,
  password
) {

  const { data, error } =
    await supabase.auth.signUp({

      email,
      password

    });

  if (error) {

    console.log(error);
    return null;

  }

  const user = data.user;

  await supabase
    .from("usuarios")
    .insert([{

      auth_id: user.id,
      nombre,
      email,
      rol_id: 3,
      zoles: 1000

    }]);
    console.log(nombre, email, password);
  return user;

}






export async function iniciarSesion(
    email,
    password
) {

    const { data, error } =
        await supabase.auth.signInWithPassword({

            email,
            password

        });

    if (error) {

        throw error;

    }

    const authUser =
        data.user;

    const {
        data: usuarioDB,
        error: dbError
    } = await supabase
        .from("usuarios")
        .select("*")
        .eq(
            "auth_id",
            authUser.id
        )
        .single();

    if (dbError) {

        throw dbError;

    }

    return usuarioDB;

}



export async function cerrarSesion() {

    await supabase.auth.signOut();

    localStorage.removeItem(
        "currentUser"
    );

}


