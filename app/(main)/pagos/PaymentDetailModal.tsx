'use client';

import { memo, useMemo, type ComponentType, type ReactNode } from 'react';
import {
  X,
  CreditCard,
  Hash,
  Tag,
  Calendar,
  MapPin,
  Building2,
  PhoneCall,
  Terminal,
  Receipt,
  Info,
} from 'lucide-react';
import type { Payment } from '@/lib/interfaces/payment.interface';
import type { Machine } from '@/lib/interfaces/machine.interface';

interface PaymentDetailModalProps {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
  enterpriseName?: string | null;
  machineDetails?: Machine | null;
  machineDetailsLoading?: boolean;
  machineDetailsError?: string | null;
}

function formatCurrency(value?: number | null): string {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const badgeBase = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border';

const statusColors = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

const SECTION_CLASS = 'rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4';

const PaymentDetailModal = memo(function PaymentDetailModal({
  payment,
  open,
  onClose,
  enterpriseName,
  machineDetails,
  machineDetailsLoading,
  machineDetailsError,
}: PaymentDetailModalProps) {
  const paymentStatus = payment?.successful ? 'Exitoso' : 'Rechazado';
  const paymentStatusColor = payment?.successful ? statusColors.success : statusColors.failed;

  const shareInfo = useMemo(() => {
    if (!payment) return '—';
    if (!payment.shares_number || payment.shares_number <= 1) {
      return 'Pago único';
    }
    const shareAmount = payment.shares_amount ? formatCurrency(payment.shares_amount) : 'monto desconocido';
    return `${payment.shares_number} cuota(s) · ${payment.share_type ?? 'sin tipo'} · ${shareAmount}`;
  }, [payment]);

  if (!open || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-gray-50 w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 bg-white rounded-t-3xl">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`${badgeBase} ${paymentStatusColor}`}>{paymentStatus}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                Operación {payment.operation_number ?? 'sin número'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                {payment.product ?? 'Venta sin producto'}
              </h2>
              <p className="text-sm text-gray-500">Venta registrada el {formatDate(payment.date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-2 border border-transparent hover:border-gray-200"
            aria-label="Cerrar detalle de pago"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5">
          <section className={SECTION_CLASS}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Resumen de la transacción
              </h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow label="ID interno" value={`#${payment.id}`} />
              <InfoRow label="Fecha registrada" value={formatDate(payment.created_at)} />
              <InfoRow label="Última actualización" value={formatDate(payment.updated_at)} />
              <InfoRow
                label="Empresa"
                value={enterpriseName ?? (payment.enterprise_id ? `ID ${payment.enterprise_id}` : 'No especificada')}
                icon={Building2}
              />
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Medio de pago
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow label="Tarjeta" value={payment.card_brand ?? 'Sin marca'} />
              <InfoRow label="Últimos dígitos" value={payment.last_digits ? `**** ${payment.last_digits}` : '—'} />
              <InfoRow label="Tipo" value={payment.card_type ?? 'No informado'} />
              <InfoRow label="Cuotas" value={shareInfo} />
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Respuesta del terminal
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Autorización"
                value={payment.authorization_code ? `Cód. ${payment.authorization_code}` : 'Sin autorización'}
              />
              <InfoRow
                label="Código / Mensaje"
                value={`${payment.response_code ?? '—'} · ${payment.response_message ?? 'Sin mensaje'}`}
                icon={Info}
              />
              <InfoRow label="Comercio" value={payment.commerce_code ?? '—'} />
              <InfoRow label="Terminal" value={payment.terminal_id ?? '—'} icon={PhoneCall} />
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Máquina asociada
            </h3>
            {machineDetailsError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {machineDetailsError}
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Nombre"
                value={
                  machineDetailsLoading
                    ? 'Obteniendo información…'
                    : machineDetails?.name ?? payment.machine?.name ?? payment.machine_name ?? 'Sin nombre'
                }
              />
              <InfoRow label="ID máquina" value={payment.machine_id ? `#${payment.machine_id}` : '—'} />
              <InfoRow
                label="Ubicación"
                value={
                  machineDetailsLoading
                    ? 'Obteniendo información…'
                    : machineDetails?.location ?? payment.machine?.location ?? 'No disponible'
                }
              />
              <InfoRow
                label="Estado"
                value={
                  machineDetailsLoading
                    ? 'Obteniendo información…'
                    : machineDetails?.status ?? payment.machine?.status ?? 'No informado'
                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

interface InfoRowProps {
  label: string;
  value: string | number | ReactNode;
  icon?: ComponentType<{ className?: string }>;
}

function InfoRow({ label, value, icon: Icon }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className="text-sm text-gray-800 break-words">{value ?? '—'}</span>
    </div>
  );
}

PaymentDetailModal.displayName = 'PaymentDetailModal';

export default PaymentDetailModal;
