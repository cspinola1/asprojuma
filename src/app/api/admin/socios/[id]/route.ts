import { createClient } from "@/lib/supabase/server";
import { tienePermiso } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Instanciar cliente Supabase de forma asíncrona
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Validar autenticación y permisos
  if (!user || !(await tienePermiso(user, "admin"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const socioId = params.id;
  const { confirmacion } = await request.json();

  // 3. Obtener datos del socio para la copia de seguridad
  const { data: socio, error: fetchError } = await supabase
    .from("socios")
    .select("*, socios_profesores(*), socios_cooperantes(*)")
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

  // 5. Insertar snapshot en la tabla de auditoría
  const { error: logError } = await supabase
    .from("socios_eliminados_log")
    .insert({
      socio_id: socioId,
      eliminado_por: user.email,
      snapshot: socio,
    });

  if (logError) {
    return NextResponse.json({ error: "Error al registrar en auditoría" }, { status: 500 });
  }

  // 6. Eliminar socio definitivamente de la base de datos
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