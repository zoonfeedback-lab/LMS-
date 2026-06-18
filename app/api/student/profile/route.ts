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

    // Try to find the user in the database
    let user = await db.user.findUnique({
      where: { name },
      include: {
        enrollments: true,
      },
    });

    // If not found, auto-create a real profile with high-fidelity defaults
    if (!user) {
      const newUser = await db.user.create({
        data: {
          name,
          role: 'student',
          title: 'Computer Science Undergraduate',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          gpa: '3.8',
          attendance: '94%',
          certificates: '5',
          enrollmentDate: 'Enrolled: Sept 2022',
        },
        include: {
          enrollments: true,
        },
      });

      // Log a default timeline activity for registration
      await db.timelineActivity.create({
        data: {
          userId: newUser.id,
          type: 'badge',
          title: "Earned 'Fast Learner' Badge",
          subtitle: "Completed 5 lessons in 24 hours",
        }
      });

      user = newUser;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, title, avatarUrl, gpa, attendance, certificates } = body;

    if (!id && !name) {
      return NextResponse.json(
        { error: 'Missing user identifier (id or name)' },
        { status: 400 }
      );
    }

    // Update profile
    const user = await db.user.update({
      where: id ? { id } : { name },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(gpa !== undefined && { gpa }),
        ...(attendance !== undefined && { attendance }),
        ...(certificates !== undefined && { certificates }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update student profile:', error);
    return NextResponse.json(
      { error: 'Failed to update student profile' },
      { status: 500 }
    );
  }
}
