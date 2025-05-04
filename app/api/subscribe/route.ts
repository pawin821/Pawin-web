// app/api/subscribe/route.ts
import { admin } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json();

  try {
    await admin.messaging().subscribeToTopic(token, 'lol');
    console.log("yes lol")
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
      console.log("no lol")
    return NextResponse.json({ success: false, error: 'Subscription failed' }, { status: 500 });
  }
}
