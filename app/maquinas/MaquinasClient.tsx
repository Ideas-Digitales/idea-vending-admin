"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";
import { Monitor, Wifi, WifiOff, MapPin, ChevronRight } from "lucide-react";
import { type Maquina, type MachinesResponse } from "./serveractions/machines";

interface MaquinasClientProps {
  machines: Maquina[];
  pagination?: MachinesResponse["pagination"];
}

export default function MaquinasClient({ machines, pagination }: MaquinasClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number | string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const created = url.searchParams.get('created');
    const error = url.searchParams.get('error');
    const deleted = url.searchParams.get('deleted');
    if (created === '1') {
      setFeedback({ type: 'success', message: 'Máquina creada correctamente.' });
    } else if (created === '0') {
      setFeedback({ type: 'error', message: decodeURIComponent(error || 'No se pudo crear la máquina.') });
    } else if (deleted === '1') {
      setFeedback({ type: 'success', message: 'Máquina eliminada correctamente.' });
    } else if (deleted === '0') {
      setFeedback({ type: 'error', message: decodeURIComponent(error || 'No se pudo eliminar la máquina.') });
    }
    if (created || error || deleted) {
      url.searchParams.delete('created');
      url.searchParams.delete('error');
      url.searchParams.delete('deleted');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  const handlePageChange = useCallback((page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    window.location.href = url.toString();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "outofservice":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusName = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Activa";
      case "inactive":
        return "Inactiva";
      case "maintenance":
        return "Mantenimiento";
      case "outofservice":
        return "Fuera de Servicio";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Máquinas</h1>
                  <p className="text-muted">Monitoreo y administración de máquinas expendedoras</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                Nueva Máquina
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {feedback && (
            <div className="mb-4">
              <div className={`card p-4 border ${feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${feedback.type === 'success' ? 'text-green-800' : 'text-red-800'} font-medium`}>{feedback.message}</p>
                  <button
                    className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-red-700'} hover:underline`}
                    onClick={() => setFeedback(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl mx-4 animate-in fade-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl flex items-center justify-between">
                  <h3 className="text-xl font-bold text-dark">Crear nueva máquina</h3>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setIsModalOpen(false)}
                    type="button"
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </div>
                <form action="/maquinas/create" method="POST" className="p-6 space-y-5">
                  <div>
                    <label className="label text-dark font-semibold">Nombre</label>
                    <input name="name" className="input-field" placeholder="Nombre de la máquina" required />
                  </div>
                  <div>
                    <label className="label text-dark font-semibold">Estado</label>
                    <select name="status" className="input-field" defaultValue="Inactive">
                      <option value="Inactive">Inactiva</option>
                      <option value="Active">Activa</option>
                      <option value="Maintenance">Mantenimiento</option>
                      <option value="OutOfService">Fuera de Servicio</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="is_enabled" className="h-4 w-4" defaultChecked />
                    <span className="text-sm text-dark">Habilitada</span>
                  </div>
                  <div>
                    <label className="label text-dark font-semibold">Ubicación</label>
                    <textarea name="location" className="input-field" rows={3} placeholder="Dirección o descripción" required />
                  </div>
                  <div>
                    <label className="label text-dark font-semibold">Tipo</label>
                    <select name="type" className="input-field" defaultValue="MDB">
                      <option value="PULSES">PULSES</option>
                      <option value="MDB">MDB</option>
                      <option value="MDB-DEX">MDB-DEX</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-dark font-semibold">Empresa ID</label>
                    <input type="number" name="enterprise_id" className="input-field" min={1} placeholder="ID de la empresa" required />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-dark min-w-[110px] cursor-pointer">Cancelar</button>
                    <button type="submit" className="btn-primary min-w-[110px] cursor-pointer">Crear</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-dark">Lista de Máquinas</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Habilitada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actualizada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conexión</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">&nbsp;</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {machines.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => (window.location.href = `/maquinas/${m.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          window.location.href = `/maquinas/${m.id}`;
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{m.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4">
                            <Monitor className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <a href={`/maquinas/${m.id}`} className="text-sm font-medium text-dark hover:underline">{m.name}</a>
                            <div className="text-xs text-muted">Tipo: {m.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(m.status)}`}>
                          {getStatusName(m.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {m.is_enabled ? (
                          <span className="text-green-600">Sí</span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-dark whitespace-pre-line">{m.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{m.client_id ?? "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{new Date(m.created_at).toLocaleString("es-ES")}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{new Date(m.updated_at).toLocaleString("es-ES")}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{m.type || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{m.enterprise_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {m.connection_status ? (
                            <Wifi className="h-4 w-4 text-green-600" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`ml-2 text-sm ${m.connection_status ? "text-green-600" : "text-red-600"}`}>
                            {m.connection_status ? "Conectada" : "Desconectada"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800 text-sm underline"
                          title="Eliminar máquina"
                          onClick={() => setDeleteTarget({ id: m.id, name: m.name })}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination?.meta && (
              <div className="px-6 py-4 border-t border-gray-100">
                <Pagination meta={pagination.meta} onPageChange={handlePageChange} />
              </div>
            )}
          </div>

          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl flex items-center justify-between">
                  <h3 className="text-xl font-bold text-dark">Confirmar eliminación</h3>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => !isDeleting && setDeleteTarget(null)}
                    type="button"
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </div>
                <form
                  action={`/maquinas/${deleteTarget.id}/delete`}
                  method="POST"
                  className="p-6 space-y-5"
                  onSubmit={() => setIsDeleting(true)}
                >
                  <p className="text-sm text-dark">
                    ¿Seguro que deseas eliminar la máquina <span className="font-semibold">{deleteTarget.name}</span>? Esta acción no se puede deshacer.
                  </p>
                  {isDeleting && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Procesando eliminación...
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setDeleteTarget(null)} className="btn-secondary text-dark min-w-[120px] cursor-pointer" disabled={isDeleting}>Cancelar</button>
                    <button type="submit" className="btn-primary min-w-[120px] cursor-pointer" disabled={isDeleting}>Eliminar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
