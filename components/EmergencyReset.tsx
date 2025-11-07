'use client';

import { useState } from 'react';
import { loopPrevention } from '@/lib/utils/loopPrevention';

export default function EmergencyReset() {
  const [isResetting, setIsResetting] = useState(false);

  const handleEmergencyReset = () => {
    setIsResetting(true);
    
    // Resetear el mecanismo de prevención de loops
    loopPrevention.reset();
    
    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    
    // Recargar la página después de un breve delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Solo mostrar en desarrollo
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleEmergencyReset}
        disabled={isResetting}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm"
      >
        {isResetting ? '🔄 Reseteando...' : '🚨 EMERGENCY RESET'}
      </button>
    </div>
  );
}
