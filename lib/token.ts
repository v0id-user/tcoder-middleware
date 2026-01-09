import { jwtVerify } from "jose";
import type { TokenPayload } from "./token.types.ts";
const DUMMY_DEMO_KEY = "dummy-demo-key";

function isTokenPayload(payload: unknown): payload is TokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "is_premium" in payload &&
    typeof (payload as Record<string, unknown>).is_premium === "boolean"
  );
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(DUMMY_DEMO_KEY));
  
  if (!isTokenPayload(payload)) {
    throw new Error("Invalid token payload structure");
  }
  
  return payload;
}