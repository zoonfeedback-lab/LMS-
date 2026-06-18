import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins || 1}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return 'Last week';
  }
}

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
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 8,
        },
      },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    const timeline = user.activities.map((act) => ({
      id: act.id,
      type: act.type,
      title: act.title,
      subtitle: act.subtitle,
      timeString: getRelativeTimeString(new Date(act.createdAt)),
    }));

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Failed to fetch student timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student timeline' },
      { status: 500 }
    );
  }
}
