import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/salesforce";

export async function GET() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store code verifier in a cookie so the callback can use it
  const cookieStore = await cookies();
  cookieStore.set("sf_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  const myDomain = process.env.SALESFORCE_MY_DOMAIN!;
  const clientId = process.env.SALESFORCE_CLIENT_ID!;
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI!;

  // Build auth URL manually using My Domain
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "api refresh_token",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `${myDomain}/services/oauth2/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
