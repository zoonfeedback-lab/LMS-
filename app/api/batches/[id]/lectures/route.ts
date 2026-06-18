import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: batchId } = await params;
    const body = await req.json();
    const { title, description, videoUrl, notesUrl } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const batch = await db.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    const lecture = await db.lecture.create({
      data: {
        batchId,
        title,
        description,
        videoUrl,
        notesUrl,
      },
    });

    return NextResponse.json(lecture);
  } catch (error) {
    console.error('Failed to create lecture:', error);
    return NextResponse.json(
      { error: 'Failed to create lecture' },
      { status: 500 }
    );
  }
}
