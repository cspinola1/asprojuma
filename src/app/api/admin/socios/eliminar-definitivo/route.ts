import { createClient } from "@/lib/supabase/server";
import { tienePermiso } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Comprobar autenticación
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Comprobar si tiene permiso (permite 'admin' o 'editar_socio')
  const esAdmin = await tienePermiso(user, "admin");
  const puedeEditar = await tienePermiso(user, "editar_socio");

  if (!esAdmin && !puedeEditar) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Extraer socioId y confirmacion desde el JSON recibido
  const { socioId, confirmacion } = await request.json();

  if (!socioId) {
    return NextResponse.json({ error: "Falta el ID del socio" }, { status: 400 });
  }

  // 1. Obtener datos para el snapshot
  const { data: socio, error: fetchError } = await supabase
    .from("socios")
    .select("*, socios_profesores(*), socios_cooperantes(*)")
    .eq("id", socioId)
    .single();

  if (fetchError || !socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  // 2. Validar texto de confirmación
  const clave = socio.dni || socio.num_socio || socio.num_cooperante;
  if (confirmacion !== `ELIMINAR ${clave}`) {
    return NextResponse.json({ error: "El texto de confirmación no coincide" }, { status: 400 });
  }

  // 3. Auditoría
  await supabase.from("socios_eliminados_log").insert({
    socio_id: socioId,
    eliminado_por: user.email,
    snapshot: socio,
  });

  // 4. Borrado definitivo
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