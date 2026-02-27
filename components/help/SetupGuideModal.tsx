'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  UserPlus,
  Building2,
  Monitor,
  Package,
  ChevronRight,
  CheckCircle2,
  Circle,
  Rocket,
} from 'lucide-react';

interface SetupStep {
  number: number;
  icon: typeof UserPlus;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  detail: string;
  href: string;
  cta: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    number: 1,
    icon: UserPlus,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    title: 'Crear usuario cliente',
    description: 'Registra al propietario de la máquina en el sistema.',
    detail: 'Crea un usuario con rol <strong>customer</strong>. Este usuario será el dueño de la empresa y podrá monitorear sus máquinas y métricas de venta.',
    href: '/usuarios/crear',
    cta: 'Ir a crear usuario',
  },
  {
    number: 2,
    icon: Building2,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    title: 'Crear empresa',
    description: 'Registra la empresa y asígnale el usuario creado.',
    detail: 'Crea la empresa con sus datos (nombre, RUT, teléfono, dirección). Al crearla, <strong>asigna el usuario customer</strong> del paso anterior como propietario.',
    href: '/empresas/crear',
    cta: 'Ir a crear empresa',
  },
  {
    number: 3,
    icon: Monitor,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    title: 'Crear máquina',
    description: 'Agrega la máquina vending y vincúlala a la empresa.',
    detail: 'Registra la máquina indicando nombre, ubicación y seleccionando la <strong>empresa creada en el paso 2</strong>. El sistema generará automáticamente las credenciales MQTT.',
    href: '/maquinas/nueva',
    cta: 'Ir a crear máquina',
  },
  {
    number: 4,
    icon: Package,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    title: 'Crear productos',
    description: 'Añade los productos disponibles en la máquina.',
    detail: 'Registra los productos con nombre y precio, asociándolos a la <strong>misma empresa</strong>. Luego podrás asignarlos a los slots físicos de la máquina desde su detalle.',
    href: '/productos/crear',
    cta: 'Ir a crear producto',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupGuideModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const step = SETUP_STEPS[activeStep];
  const isFirst = activeStep === 0;
  const isLast = activeStep === SETUP_STEPS.length - 1;

  const markAndNavigate = () => {
    setCompletedSteps(prev => new Set(prev).add(activeStep));
    onClose();
    router.push(step.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="page-header-gradient px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Alta de nuevo cliente</h2>
              <p className="text-xs text-white/70">Guía paso a paso de configuración inicial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            {SETUP_STEPS.map((s, i) => {
              const done = completedSteps.has(i);
              const active = i === activeStep;
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="flex items-center gap-1.5 group"
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.number}
                  </div>
                  {i < SETUP_STEPS.length - 1 && (
                    <div className={`h-px w-6 sm:w-10 transition-colors ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </button>
              );
            })}
            <span className="ml-1 text-xs text-muted">Paso {activeStep + 1} de {SETUP_STEPS.length}</span>
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl ${step.iconBg} shrink-0`}>
              <step.icon className={`h-6 w-6 ${step.iconColor}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-dark">{step.title}</h3>
              <p className="text-sm text-muted mt-0.5">{step.description}</p>
            </div>
          </div>

          <div
            className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: step.detail }}
          />

          <button
            onClick={markAndNavigate}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            <step.icon className="h-4 w-4" />
            {step.cta}
            <ChevronRight className="h-3.5 w-3.5 ml-auto" />
          </button>

          {/* Steps overview (collapsed) */}
          <div className="mt-4 space-y-1.5">
            {SETUP_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                  i === activeStep
                    ? 'bg-primary/8 text-primary font-medium'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {completedSteps.has(i)
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <Circle className={`h-4 w-4 shrink-0 ${i === activeStep ? 'text-primary' : 'text-gray-300'}`} />
                }
                <span className={completedSteps.has(i) ? 'line-through text-gray-400' : ''}>{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveStep(p => p - 1)}
            disabled={isFirst}
            className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {isLast ? (
            <button onClick={onClose} className="btn-secondary text-sm">
              Cerrar
            </button>
          ) : (
            <button
              onClick={() => setActiveStep(p => p + 1)}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
