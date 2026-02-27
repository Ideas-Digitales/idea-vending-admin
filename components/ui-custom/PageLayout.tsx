'use client';

import { type LucideIcon } from 'lucide-react';
import AppShell from './AppShell';
import PageHeader from './PageHeader';
import { useAuthProtection } from '@/lib/hooks/useAuthProtection';
import { TourRunner, type Step } from '@/components/help/TourRunner';

interface PageLayoutProps {
  // PageHeader props
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  headerVariant?: 'gradient' | 'white';
  // Auth props
  requiredPermissions?: string[];
  permissionMatch?: 'any' | 'all';
  // Tour
  tourSteps?: Step[];
  // Content
  children: React.ReactNode;
}

function PageSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary" />
    </div>
  );
}

export default function PageLayout({
  icon,
  title,
  subtitle,
  actions,
  backHref,
  headerVariant = 'gradient',
  requiredPermissions = [],
  permissionMatch = 'all',
  tourSteps,
  children,
}: PageLayoutProps) {
  const { shouldShowContent, isLoading, hasPermission, user } = useAuthProtection({
    requiredPermissions,
    permissionMatch,
  });

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!hasPermission && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">No tienes los permisos necesarios para acceder a esta página.</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Permisos requeridos: {requiredPermissions.join(', ')}</p>
            <p className="text-sm text-gray-500">Tus permisos: {user.permissions.join(', ')}</p>
          </div>
          <button onClick={() => window.history.back()} className="mt-6 btn-primary">
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!shouldShowContent) return null;

  const headerActions = (
    <>
      {tourSteps && tourSteps.length > 0 && (
        <TourRunner
          steps={tourSteps}
          theme={headerVariant === 'white' ? 'light' : 'dark'}
        />
      )}
      {actions}
    </>
  );

  return (
    <AppShell>
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        actions={headerActions}
        backHref={backHref}
        variant={headerVariant}
      />
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {children}
      </main>
    </AppShell>
  );
}
