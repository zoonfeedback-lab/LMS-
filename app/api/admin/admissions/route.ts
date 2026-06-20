import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getStringField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : undefined;
}

export async function GET(_req: NextRequest) {
  try {
    const requests = (await db.adminRequest.findMany({
      orderBy: { createdAt: 'desc' },
    })) as Array<Record<string, any>>;

    const admissions = requests.map((request: Record<string, any>) => {
      const selectedBatchName = request.batchName || request.selectedCourses || 'N/A';

      return {
        id: request.id,
        name: request.name,
        email: request.email,
        password: (request as any).password ?? '',
        fatherName: request.fatherName,
        cnic: request.cnic,
        dateOfBirth: request.dateOfBirth,
        gender: request.gender,
        whatsapp: request.whatsapp,
        postalAddress: request.postalAddress,
        lastQual: request.lastQual,
        passingYear: request.passingYear,
        institute: request.institute,
        emergencyName: request.emergencyName,
        emergencyRel: request.emergencyRel,
        emergencyPhone: request.emergencyPhone,
        status: request.status,
        createdAt: request.createdAt,
        batchName: request.batchName,
        selectedCourses: request.selectedCourses,
        enrollments: [
          {
            batchId: request.selectedCourses,
            batch: {
              id: request.selectedCourses,
              title: selectedBatchName,
            },
          },
        ],
      };
    });

    return NextResponse.json(admissions);
  } catch (error) {
    console.error('Failed to load admissions:', error);
    return NextResponse.json({ error: 'Failed to fetch admissions list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const requestId = getStringField(body, 'userId');

    if (!requestId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const existingRequest = await db.adminRequest.findUnique({
      where: { id: requestId },
    });
    const existingRecord = existingRequest as Record<string, any> | null;

    if (!existingRecord) {
      return NextResponse.json({ error: 'Admission request not found' }, { status: 404 });
    }

    const nextStatus = getStringField(body, 'status') || existingRecord.status;
    const nextSelectedCourses = getStringField(body, 'selectedCourses') || getStringField(body, 'desiredCourseId') || existingRecord.selectedCourses || '';
    const nextBatchName = getStringField(body, 'batchName') || existingRecord.batchName || '';

    const updatedRequest = await db.adminRequest.update({
      where: { id: requestId },
      data: {
        name: getStringField(body, 'name') || existingRecord.name,
        email: getStringField(body, 'email') || existingRecord.email,
        password: getStringField(body, 'password') || existingRecord.password,
        fatherName: getStringField(body, 'fatherName') || existingRecord.fatherName,
        cnic: getStringField(body, 'cnic') || existingRecord.cnic,
        dateOfBirth: getStringField(body, 'dateOfBirth') || existingRecord.dateOfBirth,
        gender: getStringField(body, 'gender') || existingRecord.gender,
        whatsapp: getStringField(body, 'whatsapp') || existingRecord.whatsapp,
        postalAddress: getStringField(body, 'postalAddress') || existingRecord.postalAddress,
        lastQual: getStringField(body, 'lastQual') || existingRecord.lastQual,
        passingYear: getStringField(body, 'passingYear') || existingRecord.passingYear,
        institute: getStringField(body, 'institute') || existingRecord.institute,
        emergencyName: getStringField(body, 'emergencyName') || existingRecord.emergencyName,
        emergencyRel: getStringField(body, 'emergencyRel') || existingRecord.emergencyRel,
        emergencyPhone: getStringField(body, 'emergencyPhone') || existingRecord.emergencyPhone,
        batchName: nextBatchName,
        status: nextStatus,
        selectedCourses: nextSelectedCourses,
      },
    } as any);

    if (nextStatus === 'Active' || nextStatus === 'Completed') {
      const updatedRecord = updatedRequest as Record<string, any>;

      let user = await db.user.findUnique({
        where: { email: updatedRecord.email },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            name: updatedRecord.name,
            email: updatedRecord.email,
            password: updatedRecord.password || 'changeme',
            role: 'student',
          },
        });
      }

      if (nextSelectedCourses) {
        const existingEnrollment = await db.enrollment.findUnique({
          where: {
            userId_batchId_courseId: {
              userId: user.id,
              batchId: nextSelectedCourses,
              courseId: nextSelectedCourses,
            },
          },
        });

        if (!existingEnrollment) {
          await db.enrollment.deleteMany({
            where: { userId: user.id },
          });

          await db.enrollment.create({
            data: {
              userId: user.id,
              batchId: nextSelectedCourses,
              courseId: nextSelectedCourses,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, user: updatedRequest });
  } catch (error) {
    console.error('Failed to update student admission details:', error);
    return NextResponse.json({ error: 'Failed to update details' }, { status: 500 });
  }
}
