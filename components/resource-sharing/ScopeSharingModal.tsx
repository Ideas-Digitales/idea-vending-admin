'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';
import { ResourceSharingPanel } from './ResourceSharingPanel';
import type { ResourceType } from '@/lib/interfaces/resource-share.interface';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

const RESOURCE_LABELS: Record<ResourceType, string> = {
  'App\\Models\\VendingMachine': 'máquinas',
  'App\\Models\\Product':        'productos',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ResourceType;
}

export function ScopeSharingModal({ open, onOpenChange, resourceType }: Props) {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);

  const handleClose = () => {
    setEnterprise(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-gray-500" />
            Compartir {RESOURCE_LABELS[resourceType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</p>
            <EnterpriseSearchInput
              selectedEnterpriseId={enterprise?.id}
              onEnterpriseSelect={setEnterprise}
              placeholder="Selecciona una empresa..."
            />
            <p className="text-xs text-gray-400">
              Se compartirán todos los {RESOURCE_LABELS[resourceType]} que pertenezcan a esta empresa.
            </p>
          </div>

          {enterprise && (
            <ResourceSharingPanel
              resourceType={resourceType}
              scopeId={enterprise.id}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
