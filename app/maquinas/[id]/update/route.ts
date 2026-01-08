import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.redirect(new URL(`/maquinas/${resolvedParams.id}?updated=0&error=API%20URL%20no%20configurada`, request.url), 303);
    }

    const formData = await request.formData();

    const payload: Record<string, unknown> = {};
    const name = formData.get('name');
    const status = formData.get('status');
    const is_enabled = formData.get('is_enabled');
    const location = formData.get('location');
    const type = formData.get('type');

    if (name !== null && String(name).trim() !== '') payload.name = String(name);
    if (status !== null && String(status).trim() !== '') payload.status = String(status);
    if (is_enabled !== null) payload.is_enabled = String(is_enabled) === 'on';
    if (location !== null && String(location).trim() !== '') payload.location = String(location);
    if (type !== null && String(type).trim() !== '') payload.type = String(type);
    
    // No incluir enterprise_id en actualizaciones - el API no lo permite
    // if (enterprise_id !== null && String(enterprise_id).trim() !== '' && Number(enterprise_id) > 0) {
    //   payload.enterprise_id = Number(enterprise_id);
    // }

    console.log('Payload a enviar:', JSON.stringify(payload, null, 2));

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/maquinas/${resolvedParams.id}?updated=0&error=No%20autenticado`, request.url), 303);
    }

    const res = await fetch(`${apiUrl}/machines/${resolvedParams.id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = encodeURIComponent(err?.message || err?.error || 'Error actualizando máquina');
      return NextResponse.redirect(new URL(`/maquinas/${resolvedParams.id}?updated=0&error=${msg}`, request.url), 303);
    }

    return NextResponse.redirect(new URL(`/maquinas/${resolvedParams.id}?updated=1`, request.url), 303);
  } catch (e: unknown) {
    const msg = encodeURIComponent((e as Error)?.message || 'Error inesperado');
    return NextResponse.redirect(new URL(`/maquinas/${resolvedParams.id}?updated=0&error=${msg}`, request.url), 303);
  }
}
