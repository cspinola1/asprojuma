"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  socioId: string;
  claveConfirmacion: string; // DNI o num_socio/num_cooperante — se pinta en el texto de ayuda
}

/**
 * Botón "Eliminar definitivamente" — solo debe renderizarse en la página
 * cuando el usuario actual es admin Y el socio no tiene historial
 * (el propio endpoint vuelve a comprobarlo, esto es solo UX).
 */
export default function EliminarDefinitivoSocio({ socioId, claveConfirmacion }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esperado = `ELIMINAR ${claveConfirmacion}`;

  async function confirmar() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/socios/eliminar-definitivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socioId, confirmacion: texto }),
    });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error desconocido.");
        return;
      }
      router.push("/admin/socios");
      router.refresh();
    } catch {
      setError("Error de red al intentar eliminar.");
    } finally {
      setCargando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="text-sm text-red-700 underline hover:text-red-900"
      >
        Eliminar definitivamente de la base de datos
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-800">
        Esta acción es irreversible. El registro desaparecerá por completo de la base de datos
        (solo quedará un rastro en el log de auditoría interno).
      </p>
      <p className="mt-2 text-sm text-gray-700">
        Escribe exactamente <code className="font-mono">{esperado}</code> para confirmar:
      </p>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
        placeholder={esperado}
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={confirmar}
          disabled={texto.trim() !== esperado || cargando}
          className="rounded bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {cargando ? "Eliminando..." : "Confirmar eliminación"}
        </button>
        <button
          onClick={() => {
            setAbierto(false);
            setTexto("");
            setError(null);
          }}
          className="rounded border border-gray-300 px-4 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
