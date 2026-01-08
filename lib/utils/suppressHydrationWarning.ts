/**
 * Utilidad para suprimir warnings de hidratación causados por extensiones del navegador
 * Estos warnings son comunes cuando extensiones como password managers
 * modifican el DOM agregando atributos como data-np-intersection-state
 */

// Lista de atributos conocidos que causan problemas de hidratación
const BROWSER_EXTENSION_ATTRIBUTES = [
  'data-np-intersection-state',
  'data-1p-ignore',
  'data-bitwarden-watching',
  'data-lastpass-icon-root',
  'data-dashlane-rid',
  'data-ms-editor',
];

/**
 * Función para limpiar atributos de extensiones del navegador
 * Útil para testing o debugging
 */
export function cleanBrowserExtensionAttributes(element: Element) {
  BROWSER_EXTENSION_ATTRIBUTES.forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
    }
  });
  
  // También limpiar elementos hijos
  Array.from(element.children).forEach(child => {
    cleanBrowserExtensionAttributes(child);
  });
}

/**
 * Hook para detectar si hay extensiones del navegador activas
 */
export function detectBrowserExtensions(): string[] {
  if (typeof window === 'undefined') return [];
  
  const detectedExtensions: string[] = [];
  
  BROWSER_EXTENSION_ATTRIBUTES.forEach(attr => {
    const elementsWithAttr = document.querySelectorAll(`[${attr}]`);
    if (elementsWithAttr.length > 0) {
      detectedExtensions.push(attr);
    }
  });
  
  return detectedExtensions;
}

/**
 * Configuración para desarrollo - log de extensiones detectadas
 */
export function logDetectedExtensions() {
  if (process.env.NODE_ENV === 'development') {
    const extensions = detectBrowserExtensions();
    if (extensions.length > 0) {
      console.info('🔧 Extensiones del navegador detectadas:', extensions);
      console.info('ℹ️  Esto puede causar warnings de hidratación que son seguros de ignorar');
    }
  }
}
