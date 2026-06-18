import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RoomServiceClient } from 'livekit-server-sdk';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isLive } = body;

    if (typeof isLive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid required field: isLive' },
        { status: 400 }
      );
    }

    const batch = await db.batch.findUnique({
      where: { id },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    let updatedLiveRoomId = batch.liveRoomId;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (isLive) {
      // Generate a new, unique room ID for this live session
      updatedLiveRoomId = `room-${id}-${Math.random().toString(36).substring(2, 8)}`;
    } else {
      // If closing the room and there's an active room, delete it in LiveKit to boot participants
      if (updatedLiveRoomId && apiKey && apiSecret && serverUrl) {
        try {
          const host = serverUrl.replace(/^ws/, 'http');
          const roomService = new RoomServiceClient(host, apiKey, apiSecret);
          await roomService.deleteRoom(updatedLiveRoomId);
        } catch (error) {
          // It's fine if the room was already deleted or doesn't exist
          console.warn('Failed to delete LiveKit room during live toggle off:', error);
        }
      }
      updatedLiveRoomId = null;
    }

    const updatedBatch = await db.batch.update({
      where: { id },
      data: {
        isLive,
        liveRoomId: updatedLiveRoomId,
      },
    });

    return NextResponse.json(updatedBatch);
  } catch (error) {
    console.error('Failed to toggle live state:', error);
    return NextResponse.json(
      { error: 'Failed to toggle live state' },
      { status: 500 }
    );
  }
}
