import { NextRequest, NextResponse } from "next/server";
import jsforce from "jsforce";
import { getOAuth2 } from "@/lib/salesforce";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (error) {
    return NextResponse.json({ error, errorDescription }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get("sf_code_verifier")?.value;

    if (!codeVerifier) {
      return NextResponse.json({ error: "Missing code verifier. Please restart the login flow." }, { status: 400 });
    }

    const oauth2 = getOAuth2();
    const conn = new jsforce.Connection({ oauth2 });

    // Authorize with PKCE code verifier
    await conn.authorize(code, { code_verifier: codeVerifier });

    // Clear the code verifier cookie
    cookieStore.delete("sf_code_verifier");

    // Store tokens in HTTP-only cookies for security
    cookieStore.set("sf_access_token", conn.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });
    cookieStore.set("sf_instance_url", conn.instanceUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2,
      path: "/",
    });
    if (conn.refreshToken) {
      cookieStore.set("sf_refresh_token", conn.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Salesforce OAuth error:", error);
    return NextResponse.json({ error: "Authentication failed", details: String(error) }, { status: 500 });
  }
}
