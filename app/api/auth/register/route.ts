import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      password,
      fatherName,
      cnic,
      dateOfBirth,
      gender,
      whatsapp,
      email,
      postalAddress,
      lastQual,
      passingYear,
      institute,
      desiredCourseId,
      emergencyName,
      emergencyRel,
      emergencyPhone,
      classMode,
    } = body;

    if (!name || !password || !desiredCourseId) {
      return NextResponse.json(
        { error: 'Missing name, password, or course selection' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { name },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this name already exists. Please use a unique name or contact administration.' },
        { status: 400 }
      );
    }

    // Check if email already exists (emails are case-insensitive and stored lowercased)
    const cleanedEmail = email ? email.trim().toLowerCase() : undefined;
    if (cleanedEmail) {
      const existingEmail = await db.user.findUnique({
        where: { email: cleanedEmail },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'A user with this email address already exists. Please use a unique email or log in.' },
          { status: 400 }
        );
      }
    }

    // Create the User in database
    const user = await db.user.create({
      data: {
        name,
        password,
        role: 'student',
        title: 'Pending Admission',
        avatarUrl: gender === 'Female' 
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
        gpa: 'N/A',
        attendance: '100%',
        certificates: '0',
        enrollmentDate: 'Pending Approval',
        fatherName,
        cnic,
        dateOfBirth,
        gender,
        whatsapp,
        email: cleanedEmail || null,
        postalAddress,
        lastQual,
        passingYear,
        institute,
        emergencyName,
        emergencyRel,
        emergencyPhone,
        classMode,
        status: 'Pending',
      },
    });

    // Create the Enrollment in the chosen batch (course)
    await db.enrollment.create({
      data: {
        userId: user.id,
        batchId: desiredCourseId,
      },
    });

    // Create a timeline activity
    await db.timelineActivity.create({
      data: {
        userId: user.id,
        type: 'enroll',
        title: 'Submitted Admission Form',
        subtitle: `Applied for enrollment`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
