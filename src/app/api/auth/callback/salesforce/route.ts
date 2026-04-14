import { NextRequest, NextResponse } from "next/server";
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

    const myDomain = process.env.SALESFORCE_MY_DOMAIN!;
    const clientId = process.env.SALESFORCE_CLIENT_ID!;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET!;
    const redirectUri = process.env.SALESFORCE_REDIRECT_URI!;

    // Exchange authorization code for tokens via REST (no SOAP needed)
    const tokenResponse = await fetch(`${myDomain}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token exchange failed:", errText);
      return NextResponse.json({ error: "Token exchange failed", details: errText }, { status: 400 });
    }

    const data = await tokenResponse.json();

    // Clear the code verifier cookie
    cookieStore.delete("sf_code_verifier");

    // Store tokens in HTTP-only cookies for security
    cookieStore.set("sf_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });
    cookieStore.set("sf_instance_url", data.instance_url, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2,
      path: "/",
    });
    if (data.refresh_token) {
      cookieStore.set("sf_refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    return NextResponse.redirect(new URL("/payroll", request.url));
  } catch (error) {
    console.error("Salesforce OAuth error:", error);
    return NextResponse.json({ error: "Authentication failed", details: String(error) }, { status: 500 });
  }
}
