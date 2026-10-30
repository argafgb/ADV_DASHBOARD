import { NextResponse } from 'next/server';
import { getProcessRiskDashboardData } from '@/features/process-risk/services/processRiskService';

export async function GET() {
  try {
    const data = await getProcessRiskDashboardData();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Failed to load Process & Risk dashboard data', error);
    return NextResponse.json({ message: 'Layanan data sedang tidak tersedia.' }, { status: 503 });
  }
}
