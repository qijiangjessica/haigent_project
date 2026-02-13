import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOAuth2, generateCodeVerifier, generateCodeChallenge } from "@/lib/salesforce";

export async function GET() {
  const oauth2 = getOAuth2();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store code verifier in a cookie so the callback can use it
  const cookieStore = await cookies();
  cookieStore.set("sf_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const authUrl =
    oauth2.getAuthorizationUrl({ scope: "api refresh_token" }) +
    `&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return NextResponse.redirect(authUrl);
}
