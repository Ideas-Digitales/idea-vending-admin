'use client';

import { useEffect, useState, useCallback } from 'react';
import { Share2, Plus, Trash2, Loader2, User, Building2, Layers, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getResourceSharesAction, deleteResourceShareAction, updateResourceShareAction } from '@/lib/actions/resource-shares';
import { notify } from '@/lib/adapters/notification.adapter';
import { AddResourceShareModal } from './AddResourceShareModal';
import type { ResourceShare, ResourceType, SharePermission } from '@/lib/interfaces/resource-share.interface';

const PERMISSION_LABELS: Record<SharePermission, string> = {
  read:   'Ver',
  update: 'Editar',
  delete: 'Eliminar',
};

const PERMISSION_COLORS: Record<SharePermission, string> = {
  read:   'bg-blue-100 text-blue-700',
  update: 'bg-amber-100 text-amber-700',
  delete: 'bg-red-100 text-red-700',
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
  'App\\Models\\VendingMachine': 'máquinas',
  'App\\Models\\Product':        'productos',
};

interface Props {
  resourceType: ResourceType;
  /** ID del recurso específico (para compartir individualmente) */
  resourceId?: number;
  /** ID de la empresa (para compartir todos los recursos de ese tipo) */
  scopeId?: number;
}

type AddMode = 'individual' | 'scope';

export function ResourceSharingPanel({ resourceType, resourceId, scopeId }: Props) {
  const [individualShares, setIndividualShares] = useState<ResourceShare[]>([]);
  const [scopeShares, setScopeShares]           = useState<ResourceShare[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('individual');

  const canAddIndividual = !!resourceId;
  const canAddScope      = !!scopeId;

  const loadShares = useCallback(async () => {
    setLoading(true);
    const [indRes, scopeRes] = await Promise.all([
      resourceId ? getResourceSharesAction({ resource_type: resourceType, resource_id: resourceId }) : Promise.resolve({ success: true, shares: [] }),
      scopeId    ? getResourceSharesAction({ resource_type: resourceType, scope_id: scopeId })      : Promise.resolve({ success: true, shares: [] }),
    ]);
    if (indRes.success)   setIndividualShares(indRes.shares ?? []);
    if (scopeRes.success) setScopeShares(scopeRes.shares ?? []);
    setLoading(false);
  }, [resourceType, resourceId, scopeId]);

  useEffect(() => { loadShares(); }, [loadShares]);

  const handleDelete = async (share: ResourceShare) => {
    setDeletingId(share.id);
    const result = await deleteResourceShareAction({
      resource_type: share.resource_type,
      resource_id:   share.resource_id  ?? undefined,
      scope_id:      share.scope_id     ?? undefined,
      shared_with:   { type: share.shared_with.type, id: share.shared_with.id },
    });
    setDeletingId(null);

    if (!result.success) {
      notify.error(result.error ?? 'Error al eliminar el acceso');
      return;
    }

    notify.success('Acceso eliminado correctamente');
    if (share.scope_id != null) {
      setScopeShares((prev) => prev.filter((s) => s.id !== share.id));
    } else {
      setIndividualShares((prev) => prev.filter((s) => s.id !== share.id));
    }
  };

  const openAdd = (mode: AddMode) => {
    setAddMode(mode);
    setShowAddModal(true);
  };

  const ShareRow = ({ share }: { share: ResourceShare }) => {
    const [editing, setEditing]           = useState(false);
    const [editPerms, setEditPerms]       = useState<SharePermission[]>(share.permissions);
    const [saving, setSaving]             = useState(false);

    const togglePerm = (perm: SharePermission) =>
      setEditPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);

    const handleSave = async () => {
      if (editPerms.length === 0) return;
      setSaving(true);
      const result = await updateResourceShareAction(share.id, editPerms);
      setSaving(false);
      if (!result.success) {
        notify.error(result.error ?? 'Error al actualizar el acceso');
        return;
      }
      notify.success('Permisos actualizados');
      // Update local state
      if (share.scope_id != null) {
        setScopeShares(prev => prev.map(s => s.id === share.id ? { ...s, permissions: editPerms } : s));
      } else {
        setIndividualShares(prev => prev.map(s => s.id === share.id ? { ...s, permissions: editPerms } : s));
      }
      setEditing(false);
    };

    const handleCancelEdit = () => {
      setEditPerms(share.permissions);
      setEditing(false);
    };

    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              {share.shared_with.type === 'user'
                ? <User className="h-3.5 w-3.5 text-primary" />
                : <Building2 className="h-3.5 w-3.5 text-primary" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {share.shared_with.name ?? `ID: ${share.shared_with.id}`}
              </p>
              <p className="text-xs text-gray-500">{share.shared_with.type === 'user' ? 'Usuario' : 'Empresa'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!editing && (
              <div className="flex gap-1 mr-1">
                {share.permissions.map((perm) => (
                  <span key={perm} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PERMISSION_COLORS[perm]}`}>
                    {PERMISSION_LABELS[perm]}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => setEditing(true)}
              disabled={editing || deletingId === share.id}
              className="p-1 rounded text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              title="Editar permisos"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(share)}
              disabled={deletingId === share.id || editing}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Eliminar acceso"
            >
              {deletingId === share.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />
              }
            </button>
          </div>
        </div>

        {editing && (
          <div className="flex items-center gap-3 pt-1 border-t border-gray-200">
            <div className="flex gap-2 flex-1">
              {(['read', 'update', 'delete'] as SharePermission[]).map((perm) => (
                <label key={perm} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editPerms.includes(perm)}
                    onChange={() => togglePerm(perm)}
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-primary cursor-pointer"
                  />
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${editPerms.includes(perm) ? PERMISSION_COLORS[perm] : 'text-gray-400'}`}>
                    {PERMISSION_LABELS[perm]}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={saving || editPerms.length === 0}
                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                title="Guardar"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="p-1 rounded text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">

      {/* ── Sección: recurso individual ───────────────────────────────────── */}
      {canAddIndividual && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-gray-500" />
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Este recurso</h3>
                <p className="text-xs text-gray-500">Acceso a este elemento en particular</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => openAdd('individual')}>
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : individualShares.length === 0 ? (
            <p className="text-sm text-gray-400">Sin accesos compartidos.</p>
          ) : (
            <div className="space-y-2">
              {individualShares.map((s) => <ShareRow key={s.id} share={s} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Sección: todos los recursos de la empresa ─────────────────────── */}
      {canAddScope && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Todos los {RESOURCE_LABELS[resourceType]}
                </h3>
                <p className="text-xs text-gray-500">Acceso a todos los {RESOURCE_LABELS[resourceType]} de esta empresa</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => openAdd('scope')}>
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : scopeShares.length === 0 ? (
            <p className="text-sm text-gray-400">Sin accesos compartidos.</p>
          ) : (
            <div className="space-y-2">
              {scopeShares.map((s) => <ShareRow key={s.id} share={s} />)}
            </div>
          )}
        </div>
      )}

      <AddResourceShareModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        resourceType={resourceType}
        resourceId={addMode === 'individual' ? resourceId : undefined}
        scopeId={addMode === 'scope' ? scopeId : undefined}
        onCreated={loadShares}
      />
    </div>
  );
}
