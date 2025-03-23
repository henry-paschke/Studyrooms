import { login } from "@/app/functions/cookies";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();
  const email = data.email;
  try {
    await login(email);
    return NextResponse.json({ status: 200 });
  } catch {
    return NextResponse.json({ status: 500 });
  }
}
