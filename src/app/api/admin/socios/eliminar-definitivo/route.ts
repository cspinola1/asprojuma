import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // Ajusta tu import de Supabase

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { confirmacion } = await request.json();

  // 1. Validar sesión y rol de admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const socioId = params.id;

  // 2. Obtener datos del socio para el snapshot
  const { data: socio, error: fetchError } = await supabase
    .from("socios")
    .select("*, socios_profesores(*), socios_cooperantes(*)")
    .eq("id", socioId)
    .single();

  if (fetchError || !socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  // 3. Verificar la clave de confirmación esperada (DNI, num_socio o num_cooperante)
  const clave = socio.dni || socio.num_socio || socio.num_cooperante;
  if (confirmacion !== `ELIMINAR ${clave}`) {
    return NextResponse.json({ error: "El texto de confirmación no coincide" }, { status: 400 });
  }

  // 4. Guardar copia en el log de auditoría
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

  // 5. Eliminar definitivamente de la tabla
  const { error: deleteError } = await supabase
    .from("socios")
    .delete()
    .eq("id", socioId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}