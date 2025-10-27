import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.redirect(new URL('/maquinas?page=1&deleted=0&error=API%20URL%20no%20configurada', request.url), 303);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/maquinas?page=1&deleted=0&error=No%20autenticado', request.url), 303);
    }

    const res = await fetch(`${apiUrl}/machines/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = encodeURIComponent(err?.message || err?.error || 'Error eliminando máquina');
      return NextResponse.redirect(new URL(`/maquinas?page=1&deleted=0&error=${msg}`, request.url), 303);
    }

    return NextResponse.redirect(new URL('/maquinas?page=1&deleted=1', request.url), 303);
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || 'Error inesperado');
    return NextResponse.redirect(new URL(`/maquinas?page=1&deleted=0&error=${msg}`, request.url), 303);
  }
}
