import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	return NextResponse.json({ success: false, message: 'Not implemented' }, { status: 501 });
}
