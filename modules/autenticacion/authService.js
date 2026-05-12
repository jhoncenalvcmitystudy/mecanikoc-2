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