// Microsoft Graph API — calendar availability for workIQ coffee chat scheduling

export interface MeetingSlot {
  start: string;       // ISO 8601 datetime
  end: string;         // ISO 8601 datetime
  confidence: number;  // 0–100
  reason: string;
}

interface FindSlotsOptions {
  employeeEmail: string;
  mentorEmail: string;
  timePreference?: "morning" | "afternoon" | "flexible";
  daysAhead?: number;
}

// ── Microsoft Graph auth (client credentials / app-only) ─────────────────────

async function getGraphToken(): Promise<string> {
  const tenantId     = process.env.MICROSOFT_TENANT_ID;
  const clientId     = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Microsoft Graph credentials not configured");
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "client_credentials",
        client_id:     clientId,
        client_secret: clientSecret,
        scope:         "https://graph.microsoft.com/.default",
      }).toString(),
    }
  );

  if (!res.ok) throw new Error(`Graph token error: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ── findMeetingTimes via Graph API ───────────────────────────────────────────

async function fetchSlotsFromGraph(options: FindSlotsOptions): Promise<MeetingSlot[]> {
  const { employeeEmail, mentorEmail, timePreference = "flexible", daysAhead = 7 } = options;

  const token = await getGraphToken();

  const now = new Date();
  const windowStart = new Date(now);
  if (timePreference === "afternoon") windowStart.setHours(12, 0, 0, 0);
  else windowStart.setHours(8, 0, 0, 0);

  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + daysAhead);
  if (timePreference === "morning") windowEnd.setHours(12, 0, 0, 0);
  else windowEnd.setHours(18, 0, 0, 0);

  const body = {
    attendees: [
      { type: "required", emailAddress: { address: employeeEmail } },
      { type: "required", emailAddress: { address: mentorEmail   } },
    ],
    timeConstraint: {
      activityDomain: "work",
      timeSlots: [{
        start: { dateTime: windowStart.toISOString(), timeZone: "Pacific Standard Time" },
        end:   { dateTime: windowEnd.toISOString(),   timeZone: "Pacific Standard Time" },
      }],
    },
    meetingDuration:             "PT30M",
    maxCandidates:               3,
    isOrganizerOptional:         false,
    returnSuggestionReasons:     true,
    minimumAttendeePercentage:   100,
  };

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(employeeEmail)}/findMeetingTimes`,
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`findMeetingTimes error: ${await res.text()}`);

  const data = await res.json() as { meetingTimeSuggestions?: Record<string, unknown>[] };
  const suggestions = data.meetingTimeSuggestions ?? [];

  return suggestions.slice(0, 3).map((s) => {
    const slot  = s.meetingTimeSlot as Record<string, Record<string, string>>;
    return {
      start:      slot?.start?.dateTime ?? "",
      end:        slot?.end?.dateTime   ?? "",
      confidence: Number(s.confidence ?? 100),
      reason:     String(s.suggestionReason ?? "Both attendees are available"),
    };
  });
}

// ── Mock slots (used when Azure credentials are not yet configured) ───────────

function getMockSlots(timePreference: "morning" | "afternoon" | "flexible"): MeetingSlot[] {
  const morningHours   = [9, 10, 11];
  const afternoonHours = [13, 14, 15];
  const hoursPool =
    timePreference === "morning"   ? morningHours :
    timePreference === "afternoon" ? afternoonHours :
    [...morningHours, ...afternoonHours];

  const slots: MeetingSlot[] = [];
  const now = new Date();
  let daysToAdd = 0;
  let hourIdx   = 0;

  while (slots.length < 3) {
    daysToAdd++;
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + daysToAdd);
    // Skip weekends
    if (candidate.getDay() === 0 || candidate.getDay() === 6) continue;

    const hour  = hoursPool[hourIdx % hoursPool.length];
    hourIdx++;

    const start = new Date(candidate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(30);

    slots.push({
      start:      start.toISOString(),
      end:        end.toISOString(),
      confidence: 95,
      reason:     "Both attendees are available (suggested)",
    });
  }

  return slots;
}

// ── Public API ───────────────────────────────────────────────────────────────

const hasGraphCredentials = () =>
  !!(process.env.MICROSOFT_TENANT_ID &&
     process.env.MICROSOFT_CLIENT_ID &&
     process.env.MICROSOFT_CLIENT_SECRET);

/**
 * Find up to 3 available 30-minute meeting slots where both the employee
 * and mentor are free. Uses Microsoft Graph API when Azure credentials are
 * configured; falls back to realistic mock slots otherwise.
 */
export async function findAvailableMeetingSlots(options: FindSlotsOptions): Promise<{
  slots: MeetingSlot[];
  source: "graph" | "mock";
}> {
  if (hasGraphCredentials()) {
    try {
      const slots = await fetchSlotsFromGraph(options);
      return { slots, source: "graph" };
    } catch (err) {
      console.error("Graph calendar error, falling back to mock:", err);
    }
  }
  return { slots: getMockSlots(options.timePreference ?? "flexible"), source: "mock" };
}

/**
 * Format slots into a human-readable numbered list for Engee to display.
 */
export function formatSlotsForDisplay(slots: MeetingSlot[]): string {
  if (slots.length === 0) return "No available slots found in the next 7 days.";

  return slots
    .map((slot, i) => {
      const start   = new Date(slot.start);
      const end     = new Date(slot.end);
      const day     = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const tStart  = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      const tEnd    = end.toLocaleTimeString("en-US",   { hour: "numeric", minute: "2-digit", hour12: true });
      return `**Option ${i + 1}:** ${day}, ${tStart}–${tEnd}`;
    })
    .join("\n");
}
