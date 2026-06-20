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

    if (!name || !password || !desiredCourseId || !email) {
      return NextResponse.json(
        { error: 'Missing name, email, password, or course selection' },
        { status: 400 }
      );
    }

    const cleanedEmail = email.trim().toLowerCase();

    // Check if email already exists in User table
    const existingUser = await db.user.findUnique({
      where: { email: cleanedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists. Please use a unique email or log in.' },
        { status: 400 }
      );
    }

    // Check if email already exists in AdminRequest table
    const existingRequest = await db.adminRequest.findFirst({
      where: { email: cleanedEmail },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'An admission request with this email already exists. Please wait for approval or log in.' },
        { status: 400 }
      );
    }

    // Store UI registration metadata serialized inside selectedCourses
    const meta = {
      selectedCourses: desiredCourseId,
      classMode: classMode || 'Online',
      admissionFee: '',
      discount: '',
      netPayable: '',
      admissionDate: '',
      paymentMethod: 'Cash',
      remarks: '',
      docsReceived: '',
      gpa: '3.8',
      attendance: '94%',
      certificates: '5',
      recordedAccessExpiresAt: null,
    };

    // Create the AdminRequest
    const request = await db.adminRequest.create({
      data: {
        name,
        email: cleanedEmail,
        password,
        fatherName,
        cnic,
        dateOfBirth,
        gender,
        whatsapp,
        postalAddress,
        lastQual,
        passingYear,
        institute,
        emergencyName,
        emergencyRel,
        emergencyPhone,
        batchId: desiredCourseId,
        status: 'Pending',
        selectedCourses: JSON.stringify(meta),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: request.id,
        name: request.name,
        role: 'student',
        status: 'Pending',
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
