'use client';

import React from 'react';
import { AlertCircle, RefreshCw, X, Wifi, WifiOff } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  type?: 'error' | 'warning' | 'network';
  className?: string;
}

export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  title = 'Error',
  type = 'error',
  className = '',
}: ErrorDisplayProps) {
  if (!error) return null;

  const getIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'network':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-500',
          title: 'text-orange-800',
          text: 'text-orange-700',
          button: 'text-orange-500 hover:text-orange-700',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-500',
          title: 'text-yellow-800',
          text: 'text-yellow-700',
          button: 'text-yellow-500 hover:text-yellow-700',
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500',
          title: 'text-red-800',
          text: 'text-red-700',
          button: 'text-red-500 hover:text-red-700',
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className={`${colors.icon} mr-3 mt-0.5`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${colors.title} mb-1`}>
            {title}
          </h3>
          <p className={`text-sm ${colors.text}`}>
            {error}
          </p>
          
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex items-center space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`${colors.button} text-sm font-medium flex items-center space-x-1 hover:underline transition-colors`}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reintentar</span>
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`${colors.button} text-sm font-medium hover:underline transition-colors`}
                >
                  Cerrar
                </button>
              )}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${colors.button} ml-auto transition-colors`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Componente específico para errores de red/conexión
export function NetworkErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  className 
}: Omit<ErrorDisplayProps, 'type' | 'title'>) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      title="Error de conexión"
      type="network"
      className={className}
    />
  );
}

// Componente específico para errores de API
export function ApiErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  className 
}: Omit<ErrorDisplayProps, 'type' | 'title'>) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      title="Error del servidor"
      type="error"
      className={className}
    />
  );
}

// Componente para mostrar cuando no hay datos
export function EmptyStateDisplay({
  title = "No hay datos",
  message = "No se encontraron elementos para mostrar.",
  icon: Icon = AlertCircle,
  action,
  actionLabel = "Recargar",
  className = "",
}: {
  title?: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {action && (
        <button
          onClick={action}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
