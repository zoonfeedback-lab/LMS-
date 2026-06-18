import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Missing student name parameter' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { name },
      include: {
        enrollments: true,
      },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    return NextResponse.json(user.enrollments.map((e) => e.batchId));
  } catch (error) {
    console.error('Failed to fetch student enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student enrollments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, batchId } = body;

    if (!name || !batchId) {
      return NextResponse.json(
        { error: 'Missing name or batchId parameter' },
        { status: 400 }
      );
    }

    // Find user
    let user = await db.user.findUnique({
      where: { name },
    });

    if (!user) {
      // Create user if they don't exist
      user = await db.user.create({
        data: {
          name,
          role: 'student',
          title: 'Computer Science Undergraduate',
        },
      });
    }

    // Find batch title for timeline
    const batch = await db.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Create enrollment (use upsert or check existing to prevent unique constraint crash)
    const enrollment = await db.enrollment.upsert({
      where: {
        userId_batchId: {
          userId: user.id,
          batchId,
        },
      },
      create: {
        userId: user.id,
        batchId,
      },
      update: {},
    });

    // Log a timeline event for enrollment
    await db.timelineActivity.create({
      data: {
        userId: user.id,
        type: 'enroll',
        title: `Joined ${batch.title} Batch`,
        subtitle: 'Networking with peers',
      },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Failed to enroll student:', error);
    return NextResponse.json(
      { error: 'Failed to enroll student' },
      { status: 500 }
    );
  }
}
