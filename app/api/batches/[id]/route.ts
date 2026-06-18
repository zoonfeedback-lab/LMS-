import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const batch = await db.batch.findUnique({
      where: { id },
      include: {
        lectures: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Failed to fetch batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isUpcoming, startDate, title, description, price, coverImage } = body;

    const batch = await db.batch.update({
      where: { id },
      data: {
        ...(isUpcoming !== undefined && { isUpcoming }),
        ...(startDate !== undefined && { startDate }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(coverImage !== undefined && { coverImage }),
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Failed to update batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}

