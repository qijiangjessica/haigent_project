import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/salesforce";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sf_access_token")?.value;
  const instanceUrl = cookieStore.get("sf_instance_url")?.value;

  if (!accessToken || !instanceUrl) {
    return NextResponse.json(
      { error: "Not authenticated. Visit /api/auth/salesforce to log in." },
      { status: 401 }
    );
  }

  try {
    const conn = getConnection(accessToken, instanceUrl);
    const identity = await conn.identity();
    return NextResponse.json({
      success: true,
      user: {
        username: identity.username,
        displayName: identity.display_name,
        orgId: identity.organization_id,
      },
    });
  } catch (error) {
    console.error("Salesforce test error:", error);
    return NextResponse.json({ error: "Failed to connect to Salesforce" }, { status: 500 });
  }
}
