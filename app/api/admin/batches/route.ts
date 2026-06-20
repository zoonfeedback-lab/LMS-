// app/api/batches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CREATE BATCH
export async function POST(req: NextRequest) {
  try {
    const { title, description, duration, startDate, endDate, status } =
      await req.json();

    if (!title) {
      return NextResponse.json(
        { success: false, message: "Title required" },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.create({
      data: {
        title,
        description,
        duration,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || "upcoming",
      },
    });

    return NextResponse.json(
      { success: true, batch },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Create failed" },
      { status: 500 }
    );
  }
}

// GET ALL BATCHES
export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            enrollments: true,
            requests: true,
            liveClasses: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, batches });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Fetch failed" },
      { status: 500 }
    );
  }
}