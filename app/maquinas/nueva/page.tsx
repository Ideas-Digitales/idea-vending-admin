import PageWrapper from "@/components/PageWrapper";
import Sidebar from "@/components/Sidebar";
import { Monitor } from "lucide-react";
import { redirect } from "next/navigation";
import { createMachineAction } from "@/lib/actions/machines";
import { type CreateMachineFormData } from "@/lib/schemas/machine.schema";

async function NuevaMaquinaContent() {
  async function action(formData: FormData) {
    "use server";

    // Extraer y validar datos del formulario
    const name = String(formData.get("name") || "").trim();
    const statusRaw = formData.get("status");
    const status = statusRaw && String(statusRaw).trim() ? String(statusRaw).trim() : "Inactive";
    const is_enabled = formData.get("is_enabled") === "on";
    const location = String(formData.get("location") || "").trim();
    const typeRaw = formData.get("type");
    const type = typeRaw && String(typeRaw).trim() ? String(typeRaw).trim() : "MDB";
    const enterprise_id = Number(formData.get("enterprise_id") || 0);

    // Validación de campos requeridos
    if (!name) {
      throw new Error("El nombre es requerido");
    }
    if (!location) {
      throw new Error("La ubicación es requerida");
    }
    if (!enterprise_id || enterprise_id <= 0) {
      throw new Error("El ID de empresa es requerido y debe ser mayor a 0");
    }
    if (!status || !['Active', 'Inactive', 'Maintenance', 'OutOfService'].includes(status)) {
      throw new Error("El estado debe ser válido");
    }
    if (!type || !['PULSES', 'MDB', 'MDB-DEX'].includes(type)) {
      throw new Error("El tipo debe ser válido");
    }

    const payload: CreateMachineFormData = {
      name,
      status: status as CreateMachineFormData["status"],
      is_enabled,
      location,
      type: type as CreateMachineFormData["type"],
      enterprise_id,
      client_id: null, // Campo opcional
    };

    console.log('Valores extraídos del formulario:');
    console.log('- name:', name);
    console.log('- status:', status);
    console.log('- is_enabled:', is_enabled);
    console.log('- location:', location);
    console.log('- type:', type);
    console.log('- enterprise_id:', enterprise_id);
    console.log('Payload completo a enviar:', payload);
    
    try {
      const result = await createMachineAction(payload);
      console.log('Resultado del API:', result);
      
      if (!result.success) {
        console.error('Error del API:', result.error);
        throw new Error(result.error || "No se pudo crear la máquina");
      }

      redirect("/maquinas?page=1");
    } catch (error) {
      console.error('Error al crear máquina:', error);
      // Re-lanzar el error para que se muestre en la UI
      throw error;
    }
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
                <h1 className="text-2xl font-bold text-black">Nueva Máquina</h1>
                <p className="text-gray-600">Crea una máquina usando datos reales</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <form action={action} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Nombre</label>
                <input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black" placeholder="Nombre de la máquina" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Estado</label>
                <select name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black select-custom" defaultValue="Inactive" required>
                  <option value="Inactive">Inactiva</option>
                  <option value="Active">Activa</option>
                  <option value="Maintenance">Mantenimiento</option>
                  <option value="OutOfService">Fuera de Servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Habilitada</label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="is_enabled" className="h-4 w-4" defaultChecked />
                  <span className="text-sm text-gray-600">La máquina estará habilitada</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Ubicación</label>
                <textarea name="location" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black" rows={3} placeholder="Dirección o descripción" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Tipo</label>
                <select name="type" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black select-custom" defaultValue="MDB" required>
                  <option value="PULSES">PULSES</option>
                  <option value="MDB">MDB</option>
                  <option value="MDB-DEX">MDB-DEX</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Empresa ID</label>
                <input type="number" name="enterprise_id" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black" min={1} placeholder="ID de la empresa" required />
              </div>

              <div className="flex items-center justify-end gap-3">
                <a href="/maquinas" className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</a>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Crear Máquina</button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function NuevaMaquinaPage() {
  return <NuevaMaquinaContent />;
}
