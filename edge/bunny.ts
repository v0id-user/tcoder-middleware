// @ts-nocheck - SDK types are incorrect, docs pattern works at runtime
import * as Bunny from "@bunny.net/edgescript-sdk";
import { verifyToken } from "../lib/token.ts";

function redactToken(token: string | null): string {
  if (!token) return "[none]";
  if (token.length <= 8) return "[redacted]";
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

function redactUrl(url: URL): string {
  const redactedUrl = new URL(url);
  // Remove token from query params
  if (redactedUrl.searchParams.has("token")) {
    redactedUrl.searchParams.set("token", "[redacted]");
  }
  return redactedUrl.toString();
}

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
    const tokenSource = url.searchParams.has("token") 
      ? "query" 
      : ctx.request.headers.get("Authorization")?.startsWith("Bearer ") 
        ? "authorization" 
        : ctx.request.headers.get("X-TCoder-Token") 
          ? "header" 
          : "none";

    console.log(`[TCoderMiddleware] Request: ${ctx.request.method} ${redactUrl(url)}`);
    console.log(`[TCoderMiddleware] Token source: ${tokenSource}, Token: ${redactToken(token)}`);
    console.log(`[TCoderMiddleware] Premium path: ${isPremiumPath}`);

    if (!token) {
      console.log(`[TCoderMiddleware] No token found - ${isPremiumPath ? "blocking premium path" : "allowing access"}`);
      if (isPremiumPath) {
        return Promise.resolve(new Response("Upgrade required", { status: 403 }));
      }
      return Promise.resolve(ctx.request);
    }

    console.log(`[TCoderMiddleware] Verifying token: ${redactToken(token)}`);

    return verifyToken(token)
      .then((payload) => {
        console.log(`[TCoderMiddleware] Token verified successfully`);
        console.log(`[TCoderMiddleware] Token premium status: ${payload.is_premium}`);
        console.log(`[TCoderMiddleware] Request path requires premium: ${isPremiumPath}`);
        
        if (isPremiumPath && !payload.is_premium) {
          console.log(`[TCoderMiddleware] Access denied: Premium path requires premium token`);
          return new Response("Upgrade required", { status: 403 });
        }
        
        console.log(`[TCoderMiddleware] Access granted`);
        return ctx.request;
      })
      .catch((error) => {
        console.log(`[TCoderMiddleware] Token verification failed`);
        console.log(`[TCoderMiddleware] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
        console.log(`[TCoderMiddleware] Error message: ${error instanceof Error ? error.message : String(error)}`);
        console.log(`[TCoderMiddleware] Action: ${isPremiumPath ? "blocking premium path" : "allowing access despite error"}`);
        
        if (isPremiumPath) {
          return new Response("Upgrade required", { status: 403 });
        }
        return ctx.request;
      });
  })
  .onOriginResponse((ctx: { request: Request; response: Response }) => {
    const url = new URL(ctx.request.url);
    console.log(`[TCoderMiddleware] Response: ${ctx.response.status} ${ctx.response.statusText} for ${ctx.request.method} ${redactUrl(url)}`);
    ctx.response.headers.append("X-Via", "TCoderMiddleware");
    return Promise.resolve(ctx.response);
  });
