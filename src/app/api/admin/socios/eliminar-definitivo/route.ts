import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tienePermiso } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 1. Validar autenticación de sesión con el cliente estándar
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // 3. Usar el cliente Admin (service role) para sobrepasar RLS y encontrar el registro
  const adminSupabase = createAdminClient();

  // Convertir ID a número si es numérico
  const targetId = !isNaN(Number(socioId)) ? Number(socioId) : socioId;

  const { data: socio, error: fetchError } = await adminSupabase
    .from("socios")
    .select("*")
    .eq("id", targetId)
    .maybeSingle();

  if (fetchError || !socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  // 4. Validar texto de confirmación
  const clave = socio.dni || socio.num_socio || socio.num_cooperante;
  if (confirmacion !== `ELIMINAR ${clave}`) {
    return NextResponse.json({ error: "El texto de confirmación no coincide" }, { status: 400 });
  }

  // 5. Guardar copia en el log de auditoría
  await adminSupabase.from("socios_eliminados_log").insert({
    socio_id: String(socio.id),
    eliminado_por: user.email,
    snapshot: socio,
  });

  // 6. Ejecutar borrado definitivo
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