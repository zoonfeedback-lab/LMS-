import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const batches = await db.batch.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        lectures: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, coverImage, isUpcoming, price, startDate } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const batch = await db.batch.create({
      data: {
        title,
        description,
        coverImage,
        isUpcoming: typeof isUpcoming === 'boolean' ? isUpcoming : false,
        price: price || 'Free',
        startDate: startDate || null,
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Failed to create batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
