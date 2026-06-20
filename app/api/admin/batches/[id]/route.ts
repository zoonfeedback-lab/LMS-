// app/api/batches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET SINGLE BATCH
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: {
        enrollments: true,
        requests: true,
        liveClasses: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, message: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, batch });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Fetch failed" },
      { status: 500 }
    );
  }
}

// UPDATE BATCH
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    const updatedBatch = await prisma.batch.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        duration: data.duration,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      batch: updatedBatch,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Update failed" },
      { status: 500 }
    );
  }
}

// DELETE BATCH
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.batch.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Batch deleted",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}