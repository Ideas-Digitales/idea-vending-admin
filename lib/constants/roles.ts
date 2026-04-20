export type UserRole = 'admin' | 'customer' | 'technician' | 'operador';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  customer: 'Cliente',
  technician: 'Técnico',
  operador: 'Operador',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  customer: 'bg-blue-100 text-blue-800',
  technician: 'bg-gray-100 text-gray-800',
  operador: 'bg-green-100 text-green-800',
};
