import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export function createImageProxyHandler(apiResource: string) {
  return async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { id } = await params;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'API URL no configurada' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
      const formData = await request.formData();
      const res = await fetch(`${apiUrl}/${apiResource}/${id}/image`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Error inesperado al subir imagen.' },
        { status: 500 },
      );
    }
  };
}
