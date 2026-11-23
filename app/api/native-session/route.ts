import { quotaDenied } from "@/lib/usage";
import { apiAccessDenied } from "@/lib/access";
import { readJson, safeError, sameOrigin } from "@/lib/guard";
import { nativeVoiceSession } from "@/lib/tutor";
import { parseNativeVoiceInput } from "@/lib/native-voice-contract";
import { TutorError } from "@/lib/tutor-contract";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return safeError("Start voice practice from this app.", 403);
  const denied = await apiAccessDenied();
  if (denied) return denied;
  const overAllowance = await quotaDenied("chat_sessions", 1);
  if (overAllowance) return overAllowance;
  try {
    const input = parseNativeVoiceInput(await readJson(request, 8192));
    return Response.json(await nativeVoiceSession(input, request.signal), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return error instanceof TutorError ? safeError(error.message, error.status)
      : safeError("The voice practice request could not be read. Please try again.", 400);
  }
}
