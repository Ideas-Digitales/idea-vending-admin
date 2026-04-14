const HTTP_ERRORS: Record<number, string> = {
  400: 'Solicitud incorrecta',
  401: 'No autorizado',
  403: 'Sin permisos suficientes',
  404: 'Recurso no encontrado',
  409: 'Conflicto con el estado actual',
  422: 'Datos inválidos',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
  502: 'Error de conexión',
  503: 'Servicio no disponible',
};

export function httpErrorMessage(status: number): string {
  return HTTP_ERRORS[status] ?? `Error ${status}`;
}
