import PageWrapper from "@/components/PageWrapper";
import Sidebar from "@/components/Sidebar";
import { Monitor } from "lucide-react";
import { redirect } from "next/navigation";
import { createMachineAction, type CreateMachinePayload } from "../serveractions/machines";

async function NuevaMaquinaContent() {
  async function action(formData: FormData) {
    "use server";

    const payload: CreateMachinePayload = {
      name: String(formData.get("name") || "").trim(),
      status: (formData.get("status") as CreateMachinePayload["status"]) || "Inactive",
      is_enabled: (formData.get("is_enabled") as string) === "on",
      location: String(formData.get("location") || "").trim(),
      type: (formData.get("type") as CreateMachinePayload["type"]) || "MDB",
      enterprise_id: Number(formData.get("enterprise_id") || 0),
    };

    // Validación mínima
    if (!payload.name || !payload.location || !payload.enterprise_id) {
      throw new Error("Faltan campos obligatorios");
    }

    const res = await createMachineAction(payload);
    if (!res.success) {
      throw new Error(res.error || "No se pudo crear la máquina");
    }

    redirect("/maquinas?page=1");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Nueva Máquina</h1>
                <p className="text-muted">Crea una máquina usando datos reales</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <form action={action} className="card p-6 max-w-2xl">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="label">Nombre</label>
                <input name="name" className="input-field" placeholder="Nombre de la máquina" required />
              </div>

              <div>
                <label className="label">Estado</label>
                <select name="status" className="input-field" defaultValue="Inactive">
                  <option value="Inactive">Inactiva</option>
                  <option value="Active">Activa</option>
                  <option value="Maintenance">Mantenimiento</option>
                  <option value="OutOfService">Fuera de Servicio</option>
                </select>
              </div>

              <div>
                <label className="label">Habilitada</label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="is_enabled" className="h-4 w-4" defaultChecked />
                  <span className="text-sm text-muted">La máquina estará habilitada</span>
                </div>
              </div>

              <div>
                <label className="label">Ubicación</label>
                <textarea name="location" className="input-field" rows={3} placeholder="Dirección o descripción" required />
              </div>

              <div>
                <label className="label">Tipo</label>
                <select name="type" className="input-field" defaultValue="MDB">
                  <option value="PULSES">PULSES</option>
                  <option value="MDB">MDB</option>
                  <option value="MDB-DEX">MDB-DEX</option>
                </select>
              </div>

              <div>
                <label className="label">Empresa ID</label>
                <input type="number" name="enterprise_id" className="input-field" min={1} placeholder="ID de la empresa" required />
              </div>

              <div className="flex items-center justify-end gap-3">
                <a href="/maquinas" className="btn-secondary">Cancelar</a>
                <button type="submit" className="btn-primary">Crear Máquina</button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function NuevaMaquinaPage() {
  return (
    <PageWrapper requiredPermissions={["manage_machines"]}>
      <NuevaMaquinaContent />
    </PageWrapper>
  );
}
