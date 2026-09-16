import { createClient, createAdminClient } from "@/lib/supabase/server";
import { tienePermiso } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Validar autenticación y permisos de administrador
  if (!user || !(await tienePermiso(user, "admin"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const socioId = params.id; // Mantiene la cadena completa del ID (UUID)
  const { confirmacion } = await request.json();

  // 2. Obtener datos del socio usando el cliente admin para el snapshot
  const adminSupabase = createAdminClient();
  const { data: socio, error: fetchError } = await adminSupabase
    .from("socios")
    .select("*, socios_profesores(*), socios_cooperantes(*)")
    .eq("id", socioId)
    .single();

  if (fetchError || !socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  // 3. Validar texto de confirmación
  const clave = socio.dni || socio.num_socio || socio.num_cooperante;
  if (confirmacion !== `ELIMINAR ${clave}`) {
    return NextResponse.json({ error: "El texto de confirmación no coincide" }, { status: 400 });
  }

  // 4. Guardar copia en la tabla de auditoría
  const { error: logError } = await adminSupabase
    .from("socios_eliminados_log")
    .insert({
      socio_id: socioId,
      eliminado_por: user.email,
      snapshot: socio,
    });

  if (logError) {
    return NextResponse.json({ error: "Error al registrar en auditoría" }, { status: 500 });
  }

  // 5. Eliminar registro definitivo
  const { error: deleteError } = await adminSupabase
    .from("socios")
    .delete()
    .eq("id", socioId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidatePath("/admin/socios");
  return NextResponse.json({ success: true });
}