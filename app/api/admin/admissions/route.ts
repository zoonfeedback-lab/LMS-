import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to parse metadata from AdminRequest.selectedCourses
function parseMetadata(selectedCoursesStr: string) {
  try {
    const data = JSON.parse(selectedCoursesStr);
    return {
      selectedCourses: data.selectedCourses || '',
      classMode: data.classMode || 'Online',
      admissionFee: data.admissionFee || '',
      discount: data.discount || '',
      netPayable: data.netPayable || '',
      admissionDate: data.admissionDate || '',
      paymentMethod: data.paymentMethod || 'Cash',
      remarks: data.remarks || '',
      docsReceived: data.docsReceived || '',
      gpa: data.gpa || '3.8',
      attendance: data.attendance || '94%',
      certificates: data.certificates || '5',
      recordedAccessExpiresAt: data.recordedAccessExpiresAt || null,
    };
  } catch (e) {
    return {
      selectedCourses: selectedCoursesStr,
      classMode: 'Online',
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
  }
}

export async function GET(req: NextRequest) {
  try {
    const requests = await db.adminRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        batch: true,
      },
    });

    const admissions = requests.map((r) => {
      const meta = parseMetadata(r.selectedCourses);
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        password: r.password,
        fatherName: r.fatherName,
        cnic: r.cnic,
        dateOfBirth: r.dateOfBirth,
        gender: r.gender,
        whatsapp: r.whatsapp,
        postalAddress: r.postalAddress,
        lastQual: r.lastQual,
        passingYear: r.passingYear,
        institute: r.institute,
        emergencyName: r.emergencyName,
        emergencyRel: r.emergencyRel,
        emergencyPhone: r.emergencyPhone,
        status: r.status,
        createdAt: r.createdAt,
        ...meta,
        enrollments: [
          {
            batchId: r.batchId,
            batch: r.batch,
            recordedAccessExpiresAt: meta.recordedAccessExpiresAt,
          },
        ],
      };
    });

    return NextResponse.json(admissions);
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
      userId: requestId, // In the UI, the admin edits using request.id (passed as userId)
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

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const existingRequest = await db.adminRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Admission request not found' },
        { status: 404 }
      );
    }

    const currentMeta = parseMetadata(existingRequest.selectedCourses);
    
    // Update recorded access expiry based on status
    let recordedAccessExpiresAt = currentMeta.recordedAccessExpiresAt;
    if (status === 'Completed') {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 2);
      recordedAccessExpiresAt = expiry.toISOString();
    } else if (status === 'Active' || status === 'Pending') {
      recordedAccessExpiresAt = null;
    }

    const updatedMeta = {
      selectedCourses: currentMeta.selectedCourses,
      classMode: classMode !== undefined ? classMode : currentMeta.classMode,
      admissionFee: admissionFee !== undefined ? admissionFee : currentMeta.admissionFee,
      discount: discount !== undefined ? discount : currentMeta.discount,
      netPayable: netPayable !== undefined ? netPayable : currentMeta.netPayable,
      admissionDate: admissionDate !== undefined ? admissionDate : currentMeta.admissionDate,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : currentMeta.paymentMethod,
      remarks: remarks !== undefined ? remarks : currentMeta.remarks,
      docsReceived: docsReceived !== undefined ? docsReceived : currentMeta.docsReceived,
      gpa: gpa !== undefined ? gpa : currentMeta.gpa,
      attendance: attendance !== undefined ? attendance : currentMeta.attendance,
      certificates: certificates !== undefined ? certificates : currentMeta.certificates,
      recordedAccessExpiresAt,
    };

    const newBatchId = desiredCourseId || existingRequest.batchId;

    // Save back to AdminRequest
    const updatedRequest = await db.adminRequest.update({
      where: { id: requestId },
      data: {
        status,
        batchId: newBatchId,
        selectedCourses: JSON.stringify(updatedMeta),
      },
    });

    // If active, ensure User and Enrollment exist
    if (status === 'Active' || status === 'Completed') {
      let user = await db.user.findUnique({
        where: { email: existingRequest.email },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            name: existingRequest.name,
            email: existingRequest.email,
            password: existingRequest.password,
            role: 'student',
          },
        });
      }

      // Upsert enrollment (mapping Batch to Course 1-to-1)
      // Note that in schema, Enrollment unique key is [userId, batchId, courseId]
      const existingEnrollment = await db.enrollment.findUnique({
        where: {
          userId_batchId_courseId: {
            userId: user.id,
            batchId: newBatchId,
            courseId: newBatchId,
          },
        },
      });

      if (!existingEnrollment) {
        // Remove other enrollments if they changed cohorts (matching legacy adjustment behavior)
        await db.enrollment.deleteMany({
          where: { userId: user.id },
        });

        await db.enrollment.create({
          data: {
            userId: user.id,
            batchId: newBatchId,
            courseId: newBatchId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, user: updatedRequest });
  } catch (error) {
    console.error('Failed to update student admission details:', error);
    return NextResponse.json(
      { error: 'Failed to update details' },
      { status: 500 }
    );
  }
}
