import { redirect } from 'next/navigation';

export default async function SlotsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/maquinas/${id}?tab=productos`);
}
