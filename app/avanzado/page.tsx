'use client';

import { useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import { useMqttConnectionTest } from '@/lib/hooks/useMqttConnectionTest';
import {
  Activity,
  AlertTriangle,
  Power,
  RefreshCcw,
  Terminal,
  Wifi,
  WifiOff,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Trash2,
} from 'lucide-react';

const STATUS_CONFIG: Record<ReturnType<typeof useMqttConnectionTest>['status'], {
  label: string;
  color: string;
  chip: string;
  description: string;
  icon: typeof Activity;
}> = {
  idle: {
    label: 'Sin pruebas',
    color: 'text-gray-600',
    chip: 'bg-gray-100 text-gray-700',
    description: 'Aún no se ha intentado ninguna conexión.',
    icon: Radio,
  },
  missing_credentials: {
    label: 'Credenciales incompletas',
    color: 'text-amber-600',
    chip: 'bg-amber-100 text-amber-700',
    description: 'El usuario autenticado no cuenta con usuario/contraseña MQTT.',
    icon: ShieldAlert,
  },
  connecting: {
    label: 'Conectando...',
    color: 'text-blue-600',
    chip: 'bg-blue-100 text-blue-700',
    description: 'Intentando establecer la sesión con el broker.',
    icon: RefreshCcw,
  },
  connected: {
    label: 'Conectado',
    color: 'text-emerald-600',
    chip: 'bg-emerald-100 text-emerald-700',
    description: 'Sesión establecida correctamente con el broker.',
    icon: Wifi,
  },
  disconnected: {
    label: 'Desconectado',
    color: 'text-gray-600',
    chip: 'bg-gray-200 text-gray-700',
    description: 'No existe una sesión activa en este momento.',
    icon: WifiOff,
  },
  error: {
    label: 'Error de conexión',
    color: 'text-red-600',
    chip: 'bg-red-100 text-red-700',
    description: 'La última prueba falló. Revisa los logs para más detalle.',
    icon: AlertTriangle,
  },
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function AdvancedContent() {
  const {
    status,
    logs,
    isConnecting,
    lastError,
    brokerUrl,
    credentials,
    testConnection,
    disconnect,
    sendPing,
    clearLogs,
  } = useMqttConnectionTest();

  const statusInfo = useMemo(() => STATUS_CONFIG[status], [status]);
  const hasCredentials = Boolean(credentials?.username && credentials?.original_password);

  const canSendPing = status === 'connected';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex flex-col gap-1">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.2em]">Herramientas avanzadas</p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Diagnóstico MQTT</h1>
                <p className="text-sm text-gray-600">
                  Usa tus credenciales personales para validar la conectividad con el broker.
                </p>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.chip}`}>
                <statusInfo.icon className="h-4 w-4 mr-2" />
                {statusInfo.label}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Estado de la conexión</p>
                  <p className={`text-3xl font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <statusInfo.icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-gray-600">{statusInfo.description}</p>
              {lastError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <p className="font-semibold">Último error:</p>
                  <p className="font-mono break-all">{lastError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={testConnection}
                  disabled={!hasCredentials || isConnecting || !brokerUrl}
                  className={`btn-primary flex items-center justify-center gap-2 ${(!hasCredentials || !brokerUrl) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RefreshCcw className={`h-4 w-4 ${isConnecting ? 'animate-spin' : ''}`} />
                  {isConnecting ? 'Conectando...' : 'Probar conexión'}
                </button>
                <button
                  onClick={sendPing}
                  disabled={!canSendPing}
                  className={`btn-secondary flex items-center justify-center gap-2 ${!canSendPing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Activity className="h-4 w-4" />
                  Enviar ping MQTT
                </button>
                <button
                  onClick={disconnect}
                  disabled={status !== 'connected'}
                  className={`btn-outline flex items-center justify-center gap-2 col-span-1 sm:col-span-2 ${status !== 'connected' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Power className="h-4 w-4" />
                  Desconectar
                </button>
              </div>
            </div>

            <div className="card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Broker configurado</p>
                  <p className="text-xl font-bold text-gray-900">{brokerUrl || 'No configurado'}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                  <Terminal className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-900">Modo:</span> WebSocket seguro (clean session, sin reconexión automática)
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Timeout:</span> 10s &nbsp;•&nbsp; <span className="font-semibold text-gray-900">KeepAlive:</span> 30s
                </p>
                <p>
                  <span className="font-semibold text-gray-900">QoS preferido:</span> 1
                </p>
              </div>
            </div>

            <div className="card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Credenciales del usuario</p>
                  <p className="text-xl font-bold text-gray-900">{credentials?.username || 'Sin usuario MQTT'}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${hasCredentials ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {hasCredentials ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Client ID</p>
                  <p className="font-mono text-gray-900 break-all">{credentials?.client_id || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">User ID</p>
                  <p className="font-mono text-gray-900">{credentials?.user_id ?? '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">Password</p>
                  <p className="font-mono text-gray-900 break-all">{credentials?.original_password || '—'}</p>
                </div>
              </div>
              {!hasCredentials && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Inicia sesión con un usuario que tenga credenciales MQTT asignadas para ejecutar estas pruebas.
                </p>
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Logs de conexión</h2>
                <p className="text-sm text-gray-600">Eventos más recientes primero.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={testConnection}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  disabled={!hasCredentials || isConnecting || !brokerUrl}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reintentar
                </button>
                <button
                  onClick={clearLogs}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  disabled={logs.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </button>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-80 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No hay eventos registrados aún.
                </div>
              ) : (
                <ul className="space-y-2">
                  {logs.map((log) => (
                    <li key={log.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          log.level === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-emerald-500/20 text-emerald-200'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-gray-100 ${log.level === 'error' ? 'text-red-200' : 'text-gray-100'}`}>
                        {log.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function AdvancedPage() {
  return (
    <PageWrapper requiredPermissions={['manage_machines']}>
      <AdvancedContent />
    </PageWrapper>
  );
}
