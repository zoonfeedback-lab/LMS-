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
        progress: {
          include: {
            lecture: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({});
    }

    const result: Record<string, string[]> = {};
    user.progress.forEach((p) => {
      const batchId = p.lecture.batchId;
      if (!result[batchId]) {
        result[batchId] = [];
      }
      result[batchId].push(p.lectureId);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch student progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student progress' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lectureId, completed = true } = body;

    if (!name || !lectureId) {
      return NextResponse.json(
        { error: 'Missing name or lectureId parameter' },
        { status: 400 }
      );
    }

    // Find user
    let user = await db.user.findUnique({
      where: { name },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          name,
          role: 'student',
          title: 'Computer Science Undergraduate',
        },
      });
    }

    // Find lecture details
    const lecture = await db.lecture.findUnique({
      where: { id: lectureId },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    if (completed) {
      // Mark as completed
      await db.lectureProgress.upsert({
        where: {
          userId_lectureId: {
            userId: user.id,
            lectureId,
          },
        },
        create: {
          userId: user.id,
          lectureId,
          completed: true,
        },
        update: {
          completed: true,
        },
      });

      // Log timeline activity
      await db.timelineActivity.create({
        data: {
          userId: user.id,
          type: 'watch',
          title: `Completed Session: ${lecture.title}`,
          subtitle: 'Curriculum slide materials reviewed',
        },
      });
    } else {
      // Mark as incomplete
      await db.lectureProgress.delete({
        where: {
          userId_lectureId: {
            userId: user.id,
            lectureId,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update student progress:', error);
    return NextResponse.json(
      { error: 'Failed to update student progress' },
      { status: 500 }
    );
  }
}
