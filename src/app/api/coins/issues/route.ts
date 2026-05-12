import { NextResponse } from 'next/server';

const NUMISTA_API_BASE = 'https://api.numista.com/api/v3';
const NUMISTA_API_KEY = 'Ch83szgfRoMbUDK1sG3iaF31C5rFCwbSM5pKaZnW';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing coin id' }, { status: 400 });
  }

  try {
    const res = await fetch(`${NUMISTA_API_BASE}/types/${id}/issues?lang=en`, {
      headers: { 'Numista-API-Key': NUMISTA_API_KEY },
      // Cache the response at the edge for 1 day
      next: { revalidate: 86400 } 
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch issues' }, { status: res.status });
    }

    const issues = await res.json();
    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
