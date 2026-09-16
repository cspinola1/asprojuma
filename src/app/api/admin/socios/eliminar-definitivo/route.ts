import { createClient } from "@/lib/supabase/server";
import { tienePermiso } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Validar autenticación
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Validar permisos
  const esAdmin = await tienePermiso(user, "admin");
  const puedeEditar = await tienePermiso(user, "editar_socio");
  if (!esAdmin && !puedeEditar) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { socioId, confirmacion } = await request.json();

  if (!socioId) {
    return NextResponse.json({ error: "Falta el ID del socio" }, { status: 400 });
  }

  // 3. Obtener solo los datos base del socio (sin joins complejos)
  const { data: socio, error: fetchError } = await supabase
    .from("socios")
    .select("*")
    .eq("id", socioId)
    .single();

  if (fetchError || !socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  // 4. Validar frase de confirmación
  const clave = socio.dni || socio.num_socio || socio.num_cooperante;
  if (confirmacion !== `ELIMINAR ${clave}`) {
    return NextResponse.json({ error: "El texto de confirmación no coincide" }, { status: 400 });
  }

  // 5. Guardar en auditoría
  await supabase.from("socios_eliminados_log").insert({
    socio_id: socioId,
    eliminado_por: user.email,
    snapshot: socio,
  });

  // 6. Borrado definitivo de la tabla socios
  const { error: deleteError } = await supabase
    .from("socios")
    .delete()
    .eq("id", socioId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidatePath("/admin/socios");
  return NextResponse.json({ success: true });
}