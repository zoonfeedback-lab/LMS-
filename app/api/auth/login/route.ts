import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  console.log("login route hit");
  try {

    const { name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Missing name or password' },
        { status: 400 }
      );
    }

    // Auto seed default admin if no instructor exists in the system
    const instructorsCount = await db.user.count({
      where: { role: 'instructor' },
    });

    if (instructorsCount === 0) {
      await db.user.create({
        data: {
          name: 'admin',
          email: 'admin@eduflow.com',
          password: 'admin',
          role: 'instructor',
        },
      });
    }

    const identifier = name.trim();

    // Find the user by name or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { name: identifier },
          { name: identifier.toUpperCase() },
          { email: identifier.toLowerCase() },
        ],
      },  
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username, email, or password' },
        { status: 401 }
      );
    }

   

    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
     
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
