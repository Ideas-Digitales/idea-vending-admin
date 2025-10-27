import { notFound } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import Sidebar from "@/components/Sidebar";
import { getMachineAction } from "../serveractions/machines";
import { Monitor, Wifi, WifiOff, Calendar, MapPin, KeyRound, User as UserIcon, ChevronLeft } from "lucide-react";

function getStatusChip(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return { label: "Activa", cls: "bg-green-100 text-green-800" };
  if (s === "maintenance") return { label: "Mantenimiento", cls: "bg-yellow-100 text-yellow-800" };
  if (s === "outofservice") return { label: "Fuera de Servicio", cls: "bg-orange-100 text-orange-800" };
  return { label: "Inactiva", cls: "bg-red-100 text-red-800" };
}

async function MaquinaDetalleContent({ params, searchParams }: { params: { id: string }, searchParams?: { updated?: string; error?: string } }) {
  const res = await getMachineAction(params.id);
  if (!res.success || !res.machine) {
    notFound();
  }
  const m = res.machine;
  const status = getStatusChip(m.status);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Detalle de Máquina</h1>
                <p className="text-muted">Información completa y credenciales MQTT</p>
              </div>
            </div>
            <a href="/maquinas" className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Volver
            </a>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {searchParams?.updated && (
            <div className="mb-4">
              <div className={`card p-4 border ${searchParams.updated === '1' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${searchParams.updated === '1' ? 'text-green-800' : 'text-red-800'} font-medium`}>
                    {searchParams.updated === '1' ? 'Máquina actualizada correctamente.' : decodeURIComponent(searchParams.error || 'No se pudo actualizar la máquina.')}
                  </p>
                  <a href={`/maquinas/${params.id}`} className={`${searchParams.updated === '1' ? 'text-green-700' : 'text-red-700'} text-sm hover:underline`}>Cerrar</a>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                      <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-dark">{m.name}</h2>
                      <p className="text-sm text-muted">ID: {m.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.cls}`}>{status.label}</span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted">Ubicación</p>
                      <p className="text-sm text-dark whitespace-pre-line">{m.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Tipo</p>
                    <p className="text-sm text-dark">{m.type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Empresa ID</p>
                    <p className="text-sm text-dark">{m.enterprise_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Cliente ID</p>
                    <p className="text-sm text-dark">{m.client_id ?? '-'}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    {m.connection_status ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                    <span className={`text-sm ${m.connection_status ? 'text-green-700' : 'text-red-700'}`}>{m.connection_status ? 'Conectada' : 'Desconectada'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Creada: {new Date(m.created_at).toLocaleString('es-ES')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Actualizada: {new Date(m.updated_at).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold text-dark mb-4">Editar información</h3>
                <form action={`/maquinas/${m.id}/update`} method="POST" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre</label>
                    <input name="name" defaultValue={m.name} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select name="status" defaultValue={m.status} className="input-field">
                      <option value="Inactive">Inactiva</option>
                      <option value="Active">Activa</option>
                      <option value="Maintenance">Mantenimiento</option>
                      <option value="OutOfService">Fuera de Servicio</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Ubicación</label>
                    <textarea name="location" defaultValue={m.location} className="input-field" rows={3} />
                  </div>
                  <div>
                    <label className="label">Tipo</label>
                    <select name="type" defaultValue={m.type} className="input-field">
                      <option value="PULSES">PULSES</option>
                      <option value="MDB">MDB</option>
                      <option value="MDB-DEX">MDB-DEX</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Empresa ID</label>
                    <input type="number" name="enterprise_id" defaultValue={m.enterprise_id} className="input-field" min={1} />
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <input type="checkbox" name="is_enabled" defaultChecked={m.is_enabled} className="h-4 w-4" />
                    <span className="text-sm text-dark">Habilitada</span>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                    <a href={`/maquinas/${m.id}`} className="btn-secondary text-dark min-w-[110px]">Cancelar</a>
                    <button className="btn-primary min-w-[110px]" type="submit">Guardar cambios</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-bold text-dark mb-4">Credenciales MQTT</h3>
                {!m.mqtt_user ? (
                  <p className="text-sm text-muted">No hay credenciales MQTT asociadas.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-dark">{m.mqtt_user.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-dark">{m.mqtt_user.client_id ?? '-'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted">Superusuario</p>
                        <p className="text-sm text-dark">{m.mqtt_user.is_superuser ? 'Sí' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Machine ID</p>
                        <p className="text-sm text-dark">{m.mqtt_user.machine_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Creada</p>
                        <p className="text-sm text-dark">{m.mqtt_user.created_at ? new Date(m.mqtt_user.created_at).toLocaleString('es-ES') : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Actualizada</p>
                        <p className="text-sm text-dark">{m.mqtt_user.updated_at ? new Date(m.mqtt_user.updated_at).toLocaleString('es-ES') : '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MaquinaDetallePage(props: any) {
  return (
    <PageWrapper requiredPermissions={["read", "manage_machines"]}>
      <MaquinaDetalleContent {...props} />
    </PageWrapper>
  );
}
