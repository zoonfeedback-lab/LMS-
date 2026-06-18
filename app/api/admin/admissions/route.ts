import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const students = await db.user.findMany({
      where: { role: 'student' },
      include: {
        enrollments: {
          include: {
            batch: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Failed to load admissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admissions list' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      status,
      classMode,
      admissionFee,
      discount,
      netPayable,
      admissionDate,
      paymentMethod,
      remarks,
      docsReceived,
      desiredCourseId,
      gpa,
      attendance,
      certificates,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Update the User profile and Office Use parameters
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        status,
        classMode,
        admissionFee,
        discount,
        netPayable,
        admissionDate,
        paymentMethod,
        remarks,
        docsReceived,
        gpa: gpa !== undefined ? gpa : undefined,
        attendance: attendance !== undefined ? attendance : undefined,
        certificates: certificates !== undefined ? certificates : undefined,
        // Set actual enrollment date text when approved to Active
        enrollmentDate: status === 'Active' 
          ? `Enrolled: ${admissionDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` 
          : undefined,
        title: status === 'Active' ? 'Active Student' : status === 'Completed' ? 'Graduate' : 'Student',
      },
    });

    // Handle Recorded lectures access duration setup (2 months after completion)
    if (status === 'Completed') {
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
      await db.enrollment.updateMany({
        where: { userId },
        data: {
          recordedAccessExpiresAt: twoMonthsFromNow,
        },
      });
    } else if (status === 'Active' || status === 'Pending') {
      await db.enrollment.updateMany({
        where: { userId },
        data: {
          recordedAccessExpiresAt: null,
        },
      });
    }

    // If a new course is specified, adjust their course enrollment (only if changed)
    if (desiredCourseId) {
      const existingEnrollment = await db.enrollment.findFirst({
        where: { userId, batchId: desiredCourseId },
      });

      if (!existingEnrollment) {
        // Delete existing enrollment
        await db.enrollment.deleteMany({
          where: { userId },
        });

        // Create new enrollment
        await db.enrollment.create({
          data: {
            userId,
            batchId: desiredCourseId,
          },
        });

        // Add a timeline activity for course adjustment
        const batch = await db.batch.findUnique({ where: { id: desiredCourseId } });
        await db.timelineActivity.create({
          data: {
            userId,
            type: 'enroll',
            title: 'Course Enrollment Adjusted',
            subtitle: `Switched to ${batch?.title || 'new cohort'}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Failed to update student admission details:', error);
    return NextResponse.json(
      { error: 'Failed to update details' },
      { status: 500 }
    );
  }
}
