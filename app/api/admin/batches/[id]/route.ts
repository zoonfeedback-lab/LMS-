// app/api/batches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET SINGLE BATCH
export async function GET(req: NextRequest, context: any) {
  const { params } = context || {};
  try {
    const batch = await db.batch.findUnique({
      where: { id: params?.id },
      include: {
        enrollments: true,
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
export async function PATCH(req: NextRequest, context: any) {
  const { params } = context || {};
  try {
    const data = await req.json();

    const updatedBatch = await db.batch.update({
      where: { id: params?.id },
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
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context || {};
  try {
    await db.batch.delete({
      where: { id: params?.id },
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