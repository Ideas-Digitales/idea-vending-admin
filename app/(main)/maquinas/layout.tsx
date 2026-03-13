import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Máquinas | Idea Vending Admin',
  description: 'Monitoreo y administración de máquinas expendedoras',
};

export default function MaquinasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
