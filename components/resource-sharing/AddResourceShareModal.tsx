'use client';

import { useState } from 'react';
import { Loader2, User, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';
import UserSearchInput from '@/components/UserSearchInput';
import { createResourceShareAction } from '@/lib/actions/resource-shares';
import { notify } from '@/lib/adapters/notification.adapter';
import type { ResourceType, SharedWithType, SharePermission } from '@/lib/interfaces/resource-share.interface';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';
import type { User as UserType } from '@/lib/interfaces/user.interface';

const PERMISSIONS: { id: SharePermission; label: string }[] = [
  { id: 'read',   label: 'Ver' },
  { id: 'update', label: 'Editar' },
  { id: 'delete', label: 'Eliminar' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ResourceType;
  resourceId?: number;
  scopeId?: number;
  onCreated: () => void;
}

export function AddResourceShareModal({ open, onOpenChange, resourceType, resourceId, scopeId, onCreated }: Props) {
  const [sharedWithType, setSharedWithType] = useState<SharedWithType>('user');
  const [selectedUser, setSelectedUser]             = useState<UserType | null>(null);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [permissions, setPermissions] = useState<SharePermission[]>(['read']);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setSharedWithType('user');
    setSelectedUser(null);
    setSelectedEnterprise(null);
    setPermissions(['read']);
    onOpenChange(false);
  };

  const togglePermission = (perm: SharePermission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const selectedId = sharedWithType === 'user' ? selectedUser?.id : selectedEnterprise?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || permissions.length === 0) return;

    setSaving(true);
    const result = await createResourceShareAction({
      resource_type: resourceType,
      ...(resourceId != null ? { resource_id: resourceId } : {}),
      ...(scopeId    != null ? { scope_id:    scopeId    } : {}),
      shared_with: { type: sharedWithType, id: selectedId },
      permissions,
    });
    setSaving(false);

    if (!result.success) {
      notify.error(result.error ?? 'Error al compartir el recurso');
      return;
    }

    notify.success('Acceso compartido correctamente');
    onCreated();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartir recurso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-1 space-y-4">

          {/* ── Segmented type selector ── */}
          <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
            {([
              { id: 'user'       as SharedWithType, label: 'Usuario', icon: <User      className="h-3.5 w-3.5" /> },
              { id: 'enterprise' as SharedWithType, label: 'Empresa', icon: <Building2 className="h-3.5 w-3.5" /> },
            ]).map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setSharedWithType(id); setSelectedUser(null); setSelectedEnterprise(null); }}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  sharedWithType === id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* ── Search input ── */}
          {sharedWithType === 'user' ? (
            <UserSearchInput
              selectedUserId={selectedUser?.id}
              onUserSelect={setSelectedUser}
              placeholder="Buscar usuario..."
            />
          ) : (
            <EnterpriseSearchInput
              selectedEnterpriseId={selectedEnterprise?.id}
              onEnterpriseSelect={setSelectedEnterprise}
              placeholder="Buscar empresa..."
            />
          )}

          {/* ── Permissions ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Permisos</p>
            <div className="space-y-2">
              {PERMISSIONS.map(({ id, label }) => (
                <label
                  key={id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(id)}
                    onChange={() => togglePermission(id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedId || permissions.length === 0 || saving}
              className="flex-1"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compartir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
