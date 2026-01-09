import type * as Bunny from "@bunny.net/edgescript-sdk";

type OriginRequestContext = Parameters<Parameters<ReturnType<typeof Bunny.net.http.servePullZone>["onOriginRequest"]>[0]>[0];

export function handleRequest(ctx: OriginRequestContext): Promise<Request> | Promise<Response> {
  // Example: Extract custom feature flags from headers
  const optFT = ctx.request.headers.get("feature-flags");
  const featureFlags = optFT ? optFT.split(",").map((v) => v.trimStart()) : [];

  // Example custom route logic that denies access to /d unless flag is present
  const path = new URL(ctx.request.url).pathname;
  if (path === "/d") {
    if (!featureFlags.includes("route-d-preview")) {
      return Promise.resolve(new Response("You cannot use this route.", { status: 400 })) as Promise<Response>;
    }
  }

  // Otherwise, proceed as normal
  return Promise.resolve(ctx.request) as Promise<Request>;
}
