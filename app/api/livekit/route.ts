import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room');
  const username = searchParams.get('username');
  const role = searchParams.get('role');

  if (!room || !username || !role) {
    return NextResponse.json(
      { error: 'Missing required query parameters: room, username, role' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    return NextResponse.json(
      { error: 'Server misconfiguration: LiveKit API credentials not set' },
      { status: 500 }
    );
  }

  // Enforce room creation restriction: Only instructors can create rooms.
  // Students can only join if the room has already been created.
  if (role === 'student') {
    try {
      const host = serverUrl.replace(/^ws/, 'http');
      const roomService = new RoomServiceClient(host, apiKey, apiSecret);
      const activeRooms = await roomService.listRooms([room]);
      if (activeRooms.length === 0) {
        return NextResponse.json(
          { error: 'Classroom session has not been created yet. Please wait for the instructor to start the class.' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Failed to verify room existence:', error);
      return NextResponse.json(
        { error: 'Failed to verify classroom status. Please check your LiveKit credentials in .env.local.' },
        { status: 500 }
      );
    }
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: `${username} (${role})`,
      ttl: '2h',
    });

    const isInstructor = role === 'instructor';

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,         // Everyone can publish if allowed by UI authority
      canSubscribe: true,       // Everyone can subscribe/view streams
      canPublishData: true,     // Everyone can publish data for Chat and Polls
      roomAdmin: isInstructor,  // Instructor is the admin of the room
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room');
  const role = searchParams.get('role');

  if (!room || role !== 'instructor') {
    return NextResponse.json(
      { error: 'Unauthorized: Only the instructor can close the classroom session.' },
      { status: 401 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  try {
    const host = serverUrl.replace(/^ws/, 'http');
    const roomService = new RoomServiceClient(host, apiKey, apiSecret);
    
    // Delete the room in LiveKit, terminating all active participant connections
    await roomService.deleteRoom(room);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to close room:', error);
    return NextResponse.json(
      { error: 'Failed to close classroom session' },
      { status: 500 }
    );
  }
}
