import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tienePermiso } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const esAdmin = await tienePermiso(user, "admin");
  const puedeEditar = await tienePermiso(user, "editar_socio");
  if (!esAdmin && !puedeEditar) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { socioId, confirmacion } = await request.json();

  if (!socioId) {
    return NextResponse.json({ error: "Falta el ID del socio" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const targetId = !isNaN(Number(socioId)) ? Number(socioId) : socioId;

  // 1. Obtener los datos del socio
  const { data: socio, error: fetchError } = await adminSupabase
    .from("socios")
    .select("*")
    .eq("id", targetId)
    .maybeSingle();

  if (fetchError || !socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  // 2. Validar frase de confirmación
  const clave = socio.dni || socio.num_socio || socio.num_cooperante;
  if (confirmacion !== `ELIMINAR ${clave}`) {
    return NextResponse.json({ error: "El texto de confirmación no coincide" }, { status: 400 });
  }

  // 3. Insertar en auditoría (Verificando si la tabla exige UUID o Integer)
  const { error: logError } = await adminSupabase.from("socios_eliminados_log").insert({
    socio_id: socio.id, // Mantiene el tipo de dato original del registro
    eliminado_por: user.email,
    snapshot: socio,
  });

  if (logError) {
    console.error("Error al registrar auditoría:", logError);
    return NextResponse.json(
      { error: `Error en log de auditoría: ${logError.message}` },
      { status: 500 }
    );
  }

  // 4. Borrado definitivo sólo tras confirmar auditoría
  const { error: deleteError } = await adminSupabase
    .from("socios")
    .delete()
    .eq("id", targetId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidatePath("/admin/socios");
  return NextResponse.json({ success: true });
}