// app/api/broadcast/route.ts
import { admin } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();  // Extract title and body from the request body

    if (!title || !body) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Send the dynamic notification to all subscribed users of the 'lol' topic
    await admin.messaging().send({
      topic: 'lol',
      notification: {
        title,
        body,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Broadcast failed' }, { status: 500 });
  }
}
