import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const hasAccessToken = !!cookieStore.get("sf_access_token")?.value;
  const hasRefreshToken = !!cookieStore.get("sf_refresh_token")?.value;

  return NextResponse.json({
    connected: hasAccessToken || hasRefreshToken,
  });
}
