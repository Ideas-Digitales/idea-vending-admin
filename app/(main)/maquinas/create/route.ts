import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.redirect(new URL('/maquinas?page=1&created=0&error=API%20URL%20no%20configurada', request.url), 303);
    }

    const formData = await request.formData();

    const payload = {
      name: String(formData.get('name') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      type: String(formData.get('type') || 'MDB'),
      enterprise_id: Number(formData.get('enterprise_id') || 0),
    };

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/maquinas?page=1&created=0&error=No%20autenticado', request.url), 303);
    }

    const res = await fetch(`${apiUrl}/machines`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = encodeURIComponent(err?.message || err?.error || 'Error creando máquina');
      return NextResponse.redirect(new URL(`/maquinas?page=1&created=0&error=${msg}`, request.url), 303);
    }

    // Redirect back to list after success
    return NextResponse.redirect(new URL('/maquinas?page=1&created=1', request.url), 303);
  } catch (e: unknown) {
    const msg = encodeURIComponent((e as Error)?.message || 'Error inesperado');
    return NextResponse.redirect(new URL(`/maquinas?page=1&created=0&error=${msg}`, request.url), 303);
  }
}
