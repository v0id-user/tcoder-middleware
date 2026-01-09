// @ts-nocheck - SDK types are incorrect, docs pattern works at runtime
import * as Bunny from "@bunny.net/edgescript-sdk";
import { verifyToken } from "../lib/token.ts";

function extractToken(request: Request): string | null {
  const url = new URL(request.url);
  
  const tokenFromUrl = url.searchParams.get("token");
  if (tokenFromUrl) return tokenFromUrl;
  
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  
  const originToken = request.headers.get("X-TCoder-Token");
  if (originToken) return originToken;
  
  return null;
}

Bunny.net.http
  .servePullZone({ url: "https://tcoder-pull.b-cdn.net" })
  .onOriginRequest((ctx: { request: Request }) => {
    const url = new URL(ctx.request.url);
    const isPremiumPath = url.pathname.startsWith("/premium/");
    const token = extractToken(ctx.request);

    if (!token) {
      console.log("No token found");
      if (isPremiumPath) {
        return Promise.resolve(new Response("Upgrade required", { status: 403 }));
      }
      return Promise.resolve(ctx.request);
    }

    return verifyToken(token)
      .then((payload) => {
        console.log(`Token is premium: ${payload.is_premium}`);
        if (isPremiumPath && !payload.is_premium) {
          return new Response("Upgrade required", { status: 403 });
        }
        return ctx.request;
      })
      .catch((error) => {
        console.log(`Token verification failed: ${error instanceof Error ? error.message : String(error)}`);
        if (isPremiumPath) {
          return new Response("Upgrade required", { status: 403 });
        }
        return ctx.request;
      });
  })
  .onOriginResponse((ctx: { request: Request; response: Response }) => {
    ctx.response.headers.append("X-Via", "MyMiddleware");
    return Promise.resolve(ctx.response);
  });
